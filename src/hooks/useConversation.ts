// Conversation Hook v0.7.0

import { useState, useCallback, useRef, useEffect } from 'react';
import { AgentConfiguration, AgentState, AgentStateInfo } from '../types/agent';
import { LLMProvider } from '../services/llmProvider';
import { PromptBuilder, PromptContext } from '../utils/promptBuilder';
import { logger } from '../utils/logger';

export interface ConversationState {
  isActive: boolean;
  currentAgentId: number | null;
  currentStep: number;
  totalSteps: number;
  userInput: string;
  agentStates: Record<number, AgentStateInfo>;
  conversationHistory: Array<{
    agentId: number;
    agentName: string;
    prompt: string;
    response: string;
    timestamp: string;
    status: 'pending' | 'completed' | 'failed' | 'reviewed';
  }>;
  sessionId: string;
  status: 'idle' | 'running' | 'paused' | 'completed' | 'error';
  error: string | null;
}

export interface ConversationOptions {
  autoProceed: boolean;
  enableReview: boolean;
  maxRetries: number;
  timeout: number;
  mode: 'auto' | 'manual';
}

export interface ConversationActions {
  startConversation: (userInput: string, agents: AgentConfiguration[]) => Promise<void>;
  pauseConversation: () => void;
  resumeConversation: () => void;
  stopConversation: () => void;
  proceedToNextAgent: () => Promise<void>;
  retryCurrentAgent: () => Promise<void>;
  approvePrompt: (agentId: number) => void;
  approveResponse: (agentId: number) => void;
  rejectResponse: (agentId: number, reason: string) => void;
  editResponse: (agentId: number, editedResponse: string) => void;
  editPrompt: (agentId: number, editedPrompt: string) => void;
  toggleMode: () => void;
}

// One-shot state management interface
interface AgentStepState {
  enabled: boolean;
  complete: boolean;
  currentSubStep: 'prompt_draft' | 'prompt_ok' | 'generating' | 'response_draft' | 'response_ok' | 'complete';
  promptDraftEnabled: boolean;
  promptDraftComplete: boolean;
  promptOkEnabled: boolean;
  promptOkComplete: boolean;
  generatingEnabled: boolean;
  generatingComplete: boolean;
  responseDraftEnabled: boolean;
  responseDraftComplete: boolean;
  responseOkEnabled: boolean;
  responseOkComplete: boolean;
}

export const useConversation = (
  llmProvider: LLMProvider,
  options: ConversationOptions = {
    autoProceed: true,
    enableReview: true,
    maxRetries: 3,
    timeout: 30000,
    mode: 'auto'
  }
) => {
  const [state, setState] = useState<ConversationState>({
    isActive: false,
    currentAgentId: null,
    currentStep: 0,
    totalSteps: 0,
    userInput: '',
    agentStates: {},
    conversationHistory: [],
    sessionId: '',
    status: 'idle',
    error: null
  });

  const [conversationOptions, setConversationOptions] = useState<ConversationOptions>(options);
  const agentsRef = useRef<AgentConfiguration[]>([]);
  const retryCountRef = useRef<Record<number, number>>({});
  const processingRef = useRef(false);
  
  // One-shot state management
  const [agentStepStates, setAgentStepStates] = useState<Record<number, AgentStepState>>({});

  // Initialize logger for this hook
  useEffect(() => {
    logger.info('useConversation', 'init', 'Conversation hook initialized', { agentCount: agentsRef.current.length });
  }, [agentsRef.current.length]);

  // Generate session ID
  const generateSessionId = useCallback(() => {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Initialize agent states
  const initializeAgentStates = useCallback((agents: AgentConfiguration[]) => {
    const agentStates: Record<number, AgentStateInfo> = {};
    const stepStates: Record<number, AgentStepState> = {};
    
    agents.forEach(agent => {
      agentStates[agent.id] = {
        state: 'Idle',
        lastUpdated: new Date().toISOString()
      };
      
      stepStates[agent.id] = {
        enabled: false,
        complete: false,
        currentSubStep: 'prompt_draft',
        promptDraftEnabled: false,
        promptDraftComplete: false,
        promptOkEnabled: false,
        promptOkComplete: false,
        generatingEnabled: false,
        generatingComplete: false,
        responseDraftEnabled: false,
        responseDraftComplete: false,
        responseOkEnabled: false,
        responseOkComplete: false
      };
    });
    
    return { agentStates, stepStates };
  }, []);

  // Update agent state
  const updateAgentState = useCallback((agentId: number, newState: AgentState, additionalData?: Partial<AgentStateInfo>) => {
    setState(prev => ({
      ...prev,
      agentStates: {
        ...prev.agentStates,
        [agentId]: {
          ...prev.agentStates[agentId],
          state: newState,
          lastUpdated: new Date().toISOString(),
          ...additionalData
        }
      }
    }));
  }, []);

  // One-shot step management
  const enableAgentStep = useCallback((agentId: number) => {
    logger.info('useConversation', 'enableAgentStep', `Enabling agent ${agentId}`);
    setAgentStepStates(prev => {
      const current = prev[agentId];
      logger.debug('useConversation', 'enableAgentStep', `Current state for agent ${agentId}`, current);
      
      if (!current || current.enabled || current.complete) {
        logger.debug('useConversation', 'enableAgentStep', `Agent ${agentId} already enabled or complete, skipping`);
        return prev;
      }
      
      logger.info('useConversation', 'enableAgentStep', `Enabling agent ${agentId}`);
      return {
        ...prev,
        [agentId]: {
          ...current,
          enabled: true
        }
      };
    });
  }, []);

  const completeAgentStep = useCallback((agentId: number) => {
    setAgentStepStates(prev => {
      const current = prev[agentId];
      if (!current || current.complete) return prev;
      
      return {
        ...prev,
        [agentId]: {
          ...current,
          complete: true
        }
      };
    });
  }, []);

  const enableSubStep = useCallback((agentId: number, subStep: 'promptDraftEnabled' | 'promptOkEnabled' | 'generatingEnabled' | 'responseDraftEnabled' | 'responseOkEnabled') => {
    logger.debug('useConversation', 'enableSubStep', `Enabling sub-step ${subStep} for agent ${agentId}`);
    setAgentStepStates(prev => {
      const current = prev[agentId];
      if (!current || current[subStep] || current.complete) return prev;
      
      return {
        ...prev,
        [agentId]: {
          ...current,
          [subStep]: true
        }
      };
    });
  }, []);

  const completeSubStep = useCallback((agentId: number, subStep: 'promptDraftComplete' | 'promptOkComplete' | 'generatingComplete' | 'responseDraftComplete' | 'responseOkComplete') => {
    logger.debug('useConversation', 'completeSubStep', `Completing sub-step ${subStep} for agent ${agentId}`);
    setAgentStepStates(prev => {
      const current = prev[agentId];
      if (!current || current.complete) return prev;
      
      return {
        ...prev,
        [agentId]: {
          ...current,
          [subStep]: true
        }
      };
    });
  }, []);

  // Toggle between auto and manual mode
  const toggleMode = useCallback(() => {
    setConversationOptions(prev => ({
      ...prev,
      mode: prev.mode === 'auto' ? 'manual' : 'auto',
      autoProceed: prev.mode === 'auto' ? false : true
    }));
  }, []);

  // Edit prompt for a specific agent
  const editPrompt = useCallback((agentId: number, editedPrompt: string) => {
    setState(prev => ({
      ...prev,
      conversationHistory: prev.conversationHistory.map(entry =>
        entry.agentId === agentId
          ? { ...entry, prompt: editedPrompt }
          : entry
      )
    }));
    updateAgentState(agentId, 'Active.Prompt_Draft', { currentPrompt: editedPrompt });
  }, [updateAgentState]);

  // Approve prompt
  const approvePrompt = useCallback((agentId: number) => {
    completeSubStep(agentId, 'promptDraftComplete');
    enableSubStep(agentId, 'promptOkEnabled');
    updateAgentState(agentId, 'Active.Prompt_OK', { promptApproved: true });
    
    logger.info('useConversation', 'approvePrompt', `Prompt approved for agent ${agentId}`);
  }, [updateAgentState, completeSubStep, enableSubStep]);

  // Start a new conversation
  const startConversation = useCallback(async (userInput: string, agents: AgentConfiguration[]) => {
    logger.functionEntry('useConversation', 'startConversation', { userInput, mode: conversationOptions.mode });
    
    if (!userInput.trim()) {
      logger.warn('useConversation', 'startConversation', 'Empty user input provided');
      return;
    }

    if (agents.length === 0) {
      logger.error('useConversation', 'startConversation', 'No agents configured');
      return;
    }

    logger.info('useConversation', 'startConversation', 'Starting new conversation', {
      userInput,
      agentCount: agents.length,
      mode: conversationOptions.mode
    });

    if (state.isActive) {
      logger.info('useConversation', 'startConversation', 'Conversation already active, stopping first');
      await stopConversation();
    }

    // Update agents reference
    agentsRef.current = agents;

    const sessionId = generateSessionId();
    const { agentStates, stepStates } = initializeAgentStates(agents);
    
    logger.info('useConversation', 'startConversation', 'Setting up conversation state...');

    setState({
      isActive: true,
      currentAgentId: agents[0].id,
      currentStep: 1,
      totalSteps: agents.length,
      userInput: userInput.trim(),
      agentStates,
      conversationHistory: [],
      sessionId,
      status: 'running' as const,
      error: null
    });

    setAgentStepStates(stepStates);
    retryCountRef.current = {};
    processingRef.current = false;

    logger.info('useConversation', 'startConversation', 'Conversation started successfully', {
      sessionId,
      firstAgent: agents[0]
    });
    
    logger.functionExit('useConversation', 'startConversation', { sessionId });
  }, [state.isActive, generateSessionId, conversationOptions.mode, initializeAgentStates]);

  // Process the current agent
  const processCurrentAgent = useCallback(async () => {
    logger.functionEntry('useConversation', 'processCurrentAgent');
    
    if (processingRef.current) {
      logger.debug('useConversation', 'processCurrentAgent', 'Already processing, skipping');
      return;
    }

    processingRef.current = true;
    logger.info('useConversation', 'processCurrentAgent', 'Starting to process current agent', {
      currentAgentId: state.currentAgentId,
      currentStep: state.currentStep,
      totalSteps: state.totalSteps
    });

    if (!state.currentAgentId) {
      logger.error('useConversation', 'processCurrentAgent', 'No current agent ID');
      processingRef.current = false;
      return;
    }

    const currentStepState = agentStepStates[state.currentAgentId];
    logger.debug('useConversation', 'processCurrentAgent', 'Current step state', currentStepState);

    // Check if agent step is not enabled yet
    if (!currentStepState?.enabled) {
      logger.info('useConversation', 'processCurrentAgent', 'Agent step not enabled yet, enabling...');
      enableAgentStep(state.currentAgentId);
      // Don't return here - continue processing after enabling
      logger.info('useConversation', 'processCurrentAgent', 'Agent step enabled, continuing...');
    }

    // Check if agent step is complete
    if (currentStepState?.complete) {
      logger.info('useConversation', 'processCurrentAgent', 'Agent step already complete, not proceeding automatically');
      processingRef.current = false;
      return;
    }

    const currentAgent = agentsRef.current.find(a => a.id === state.currentAgentId);
    if (!currentAgent) {
      logger.error('useConversation', 'processCurrentAgent', 'Current agent not found', { agentId: state.currentAgentId });
      setState(prev => ({ ...prev, status: 'error', error: 'Current agent not found' }));
      processingRef.current = false;
      return;
    }

    logger.info('useConversation', 'processCurrentAgent', 'Starting agent', {
      agentId: currentAgent.id,
      agentName: currentAgent.name
    });

    // Update agent state to Running
    updateAgentState(currentAgent.id, 'Active.Generating');

    // Process all steps in sequence
    try {
      // Step 1: Prompt Draft
      if (!currentStepState?.promptDraftComplete) {
        logger.info('useConversation', 'processCurrentAgent', 'Starting prompt draft step');
        
        if (!currentStepState?.promptDraftEnabled) {
          enableSubStep(currentAgent.id, 'promptDraftEnabled');
        }

        const promptContext: PromptContext = {
          userInput: state.userInput,
          agentResponses: Object.fromEntries(
            Object.entries(state.agentStates)
              .filter(([_, agentState]) => agentState.state === 'Complete')
              .map(([agentId, agentState]) => [agentId, agentState.currentResponse || ''])
          ),
          conversationHistory: state.conversationHistory,
          metadata: {
            sessionId: state.sessionId,
            currentAgentId: currentAgent.id,
            totalAgents: agentsRef.current.length,
            stepNumber: state.currentStep
          }
        };

        logger.debug('useConversation', 'processCurrentAgent', 'Prompt context', promptContext);

        const promptRequest = PromptBuilder.buildPrompt(currentAgent, promptContext);
        logger.debug('useConversation', 'processCurrentAgent', 'Built prompt request', promptRequest);

        // Store the prompt in agent state
        updateAgentState(currentAgent.id, 'Active.Prompt_Draft', {
          currentPrompt: promptRequest.prompt
        });

        // Store the prompt for review
        setState(prev => ({
          ...prev,
          conversationHistory: [...prev.conversationHistory, {
            agentId: currentAgent.id,
            agentName: currentAgent.name,
            prompt: promptRequest.prompt,
            response: '',
            timestamp: new Date().toISOString(),
            status: 'pending'
          }]
        }));

        completeSubStep(currentAgent.id, 'promptDraftComplete');

        // In manual mode, wait for user approval
        if (conversationOptions.mode === 'manual') {
          logger.info('useConversation', 'processCurrentAgent', 'Manual mode - waiting for prompt approval');
          processingRef.current = false;
          return;
        }
      }

      // Step 2: Prompt OK (auto-approve in auto mode)
      if (!currentStepState?.promptOkComplete && currentStepState?.promptDraftComplete) {
        if (conversationOptions.mode === 'auto') {
          logger.info('useConversation', 'processCurrentAgent', 'Auto-approving prompt in auto mode');
          
          if (!currentStepState?.promptOkEnabled) {
            enableSubStep(currentAgent.id, 'promptOkEnabled');
          }
          completeSubStep(currentAgent.id, 'promptOkComplete');
        } else {
          logger.info('useConversation', 'processCurrentAgent', 'Manual mode - waiting for prompt approval');
          processingRef.current = false;
          return;
        }
      }

      // Step 3: Generating
      if (!currentStepState?.generatingComplete && currentStepState?.promptOkComplete) {
        logger.info('useConversation', 'processCurrentAgent', 'Starting LLM generation');
        
        if (!currentStepState?.generatingEnabled) {
          enableSubStep(currentAgent.id, 'generatingEnabled');
        }

        const currentAgentState = state.agentStates[currentAgent.id];
        const promptRequest = {
          prompt: currentAgentState?.currentPrompt || '',
          maxTokens: currentAgent.task.maxTokens,
          temperature: currentAgent.task.temperature,
          outputFormat: currentAgent.task.outputFormat
        };

        logger.info('useConversation', 'processCurrentAgent', 'Sending prompt to LLM', {
          promptLength: promptRequest.prompt.length,
          maxTokens: promptRequest.maxTokens,
          temperature: promptRequest.temperature
        });

        const response = await Promise.race([
          llmProvider.complete(promptRequest),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('LLM request timeout')), 30000)
          )
        ]) as { content: string };

        logger.info('useConversation', 'processCurrentAgent', 'LLM response received', { responseLength: response.content.length });
        
        // Store the response in agent state
        updateAgentState(currentAgent.id, 'Active.Response_Draft', {
          currentResponse: response.content
        });

        // Store the response for review
        setState(prev => ({
          ...prev,
          conversationHistory: [...prev.conversationHistory, {
            agentId: currentAgent.id,
            agentName: currentAgent.name,
            prompt: currentAgentState?.currentPrompt || '',
            response: response.content,
            timestamp: new Date().toISOString(),
            status: 'pending'
          }]
        }));

        completeSubStep(currentAgent.id, 'generatingComplete');

        // In manual mode, wait for user approval
        if (conversationOptions.mode === 'manual') {
          logger.info('useConversation', 'processCurrentAgent', 'Manual mode - waiting for response approval');
          processingRef.current = false;
          return;
        }
      }

      // Step 4: Response OK (auto-approve in auto mode)
      if (!currentStepState?.responseOkComplete && currentStepState?.generatingComplete) {
        if (conversationOptions.mode === 'auto') {
          logger.info('useConversation', 'processCurrentAgent', 'Auto-approving response in auto mode');
          
          if (!currentStepState?.responseOkEnabled) {
            enableSubStep(currentAgent.id, 'responseOkEnabled');
          }
          completeSubStep(currentAgent.id, 'responseOkComplete');
        } else {
          logger.info('useConversation', 'processCurrentAgent', 'Manual mode - waiting for response approval');
          processingRef.current = false;
          return;
        }
      }

      // Step 5: Complete (only in auto mode)
      if (!currentStepState?.complete && currentStepState?.responseOkComplete) {
        if (conversationOptions.mode === 'auto') {
          logger.info('useConversation', 'processCurrentAgent', 'Completing agent step in auto mode');
          
          // Add to conversation history
          const currentAgentState = state.agentStates[currentAgent.id];
          const historyEntry = {
            agentId: state.currentAgentId,
            agentName: currentAgent.name,
            prompt: currentAgentState?.currentPrompt || '',
            response: currentAgentState?.currentResponse || '',
            timestamp: new Date().toISOString(),
            status: 'completed' as const
          };

          setState(prev => ({
            ...prev,
            conversationHistory: [...prev.conversationHistory, historyEntry]
          }));

          // Update agent state to Completed
          updateAgentState(currentAgent.id, 'Complete');

          // Mark step as complete
          if (state.currentAgentId !== null) {
            setAgentStepStates(prev => ({
              ...prev,
              [state.currentAgentId as number]: {
                ...prev[state.currentAgentId as number],
                complete: true
              }
            }));
          }

          logger.info('useConversation', 'processCurrentAgent', 'Agent step completed successfully in auto mode');
        } else {
          logger.info('useConversation', 'processCurrentAgent', 'Manual mode - agent step ready for completion');
          processingRef.current = false;
          return;
        }
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      logger.error('useConversation', 'processCurrentAgent', 'Error processing agent', { error: errorMessage });
      
      // Update agent state to Failed
      updateAgentState(currentAgent.id, 'Complete');

      logger.error('useConversation', 'processCurrentAgent', 'Agent failed', { agentName: currentAgent.name, error: errorMessage });
      processingRef.current = false;
    }
    
    processingRef.current = false;
    logger.functionExit('useConversation', 'processCurrentAgent');
  }, [state, llmProvider, conversationOptions, updateAgentState, agentStepStates, enableAgentStep, enableSubStep, completeSubStep, completeAgentStep, approvePrompt]);

  // Proceed to the next agent
  const proceedToNextAgent = useCallback(async () => {
    logger.functionEntry('useConversation', 'proceedToNextAgent');
    logger.info('useConversation', 'proceedToNextAgent', 'Starting...', {
      currentStep: state.currentStep,
      totalSteps: state.totalSteps,
      mode: conversationOptions.mode
    });
    
    if (!state.isActive || state.currentStep >= state.totalSteps) {
      // Conversation completed
      logger.info('useConversation', 'proceedToNextAgent', 'Conversation completed');
      setState(prev => ({
        ...prev,
        status: 'completed',
        isActive: false
      }));
      return;
    }

    const nextStep = state.currentStep + 1;
    const nextAgent = agentsRef.current[nextStep - 1]; // Array is 0-indexed, steps are 1-indexed
    
    logger.info('useConversation', 'proceedToNextAgent', 'Next agent lookup', {
      currentStep: state.currentStep,
      nextStep,
      totalAgents: agentsRef.current.length,
      agents: agentsRef.current.map(a => ({ id: a.id, name: a.name })),
      nextAgent
    });
    
    if (!nextAgent) {
      logger.error('useConversation', 'proceedToNextAgent', 'Next agent not found', {
        currentStep: state.currentStep,
        nextStep,
        totalSteps: state.totalSteps,
        agents: agentsRef.current.map(a => ({ id: a.id, name: a.name }))
      });
      setState(prev => ({ ...prev, status: 'error', error: 'Next agent not found' }));
      return;
    }

    logger.info('useConversation', 'proceedToNextAgent', 'Moving to next agent', {
      agentName: nextAgent.name,
      agentId: nextAgent.id,
      nextStep
    });
    
    setState(prev => ({
      ...prev,
      currentAgentId: nextAgent.id,
      currentStep: nextStep
    }));

    // In manual mode, don't automatically process the next agent
    if (conversationOptions.mode === 'manual') {
      logger.info('useConversation', 'proceedToNextAgent', 'Manual mode - waiting for user to start next agent');
      return;
    }

    // In auto mode, process the next agent
    logger.info('useConversation', 'proceedToNextAgent', 'Auto mode - processing next agent');
    await processCurrentAgent();
  }, [state, processCurrentAgent, conversationOptions.mode]);

  // Effect to handle conversation state changes and auto-start processing
  useEffect(() => {
    logger.debug('useConversation', 'useEffect', 'Checking conversation state', {
      isActive: state.isActive,
      currentAgentId: state.currentAgentId,
      status: state.status,
      processing: processingRef.current
    });
    
    if (state.isActive && state.currentAgentId && state.status === 'running' && !processingRef.current) {
      logger.info('useConversation', 'useEffect', 'Conversation is active and ready to process', {
        currentAgentId: state.currentAgentId,
        currentStep: state.currentStep,
        mode: conversationOptions.mode
      });
      
      const currentStepState = agentStepStates[state.currentAgentId];
      logger.debug('useConversation', 'useEffect', 'Current step state', currentStepState);
      
      // Only process if agent step is not enabled yet
      if (!currentStepState?.enabled && !currentStepState?.complete) {
        logger.info('useConversation', 'useEffect', 'Starting to process current agent');
        processCurrentAgent();
      }
    } else {
      logger.debug('useConversation', 'useEffect', 'Not ready to process - conditions not met', {
        isActive: state.isActive,
        currentAgentId: state.currentAgentId,
        status: state.status,
        processing: processingRef.current
      });
    }
  }, [state.isActive, state.currentAgentId, state.status, state.currentStep, conversationOptions.mode]);

  // Effect to handle agent step state transitions
  useEffect(() => {
    if (state.isActive && state.currentAgentId && state.status === 'running') {
      const currentStepState = agentStepStates[state.currentAgentId];
      
      // If agent step is enabled but not complete, continue processing
      if (currentStepState?.enabled && !currentStepState?.complete && !processingRef.current) {
        logger.info('useConversation', 'useEffect', 'Agent step enabled, continuing processing');
        processCurrentAgent();
      }
    }
  }, [agentStepStates, state.isActive, state.currentAgentId, state.status]);

  // Effect to handle prompt approval in manual mode
  useEffect(() => {
    if (state.isActive && state.currentAgentId && state.status === 'running' && conversationOptions.mode === 'manual') {
      const currentStepState = agentStepStates[state.currentAgentId];
      
      // If prompt is approved and we're in manual mode, continue processing
      if (currentStepState?.promptOkComplete && !currentStepState?.generatingComplete && !processingRef.current) {
        logger.info('useConversation', 'useEffect', 'Prompt approved in manual mode, continuing to generation');
        processCurrentAgent();
      }
    }
  }, [agentStepStates, state.isActive, state.currentAgentId, state.status, conversationOptions.mode]);

  // Effect to handle response approval in manual mode
  useEffect(() => {
    if (state.isActive && state.currentAgentId && state.status === 'running' && conversationOptions.mode === 'manual') {
      const currentStepState = agentStepStates[state.currentAgentId];
      
      // If response is approved and we're in manual mode, complete the agent
      if (currentStepState?.responseOkComplete && !currentStepState?.complete && !processingRef.current) {
        logger.info('useConversation', 'useEffect', 'Response approved in manual mode, completing agent');
        
        // Complete the agent step
        if (state.currentAgentId !== null) {
          setAgentStepStates(prev => ({
            ...prev,
            [state.currentAgentId as number]: {
              ...prev[state.currentAgentId as number],
              complete: true
            }
          }));
        }
      }
    }
  }, [agentStepStates, state.isActive, state.currentAgentId, state.status, conversationOptions.mode]);

  // Effect to handle agent completion and transition to next agent
  useEffect(() => {
    if (state.isActive && state.currentAgentId && state.status === 'running') {
      const currentStepState = agentStepStates[state.currentAgentId];
      
      // If current agent step is complete, proceed to next agent
      if (currentStepState?.complete && !processingRef.current) {
        logger.info('useConversation', 'useEffect', 'Agent step complete, proceeding to next agent', {
          currentAgentId: state.currentAgentId,
          currentStep: state.currentStep,
          totalSteps: state.totalSteps
        });
        
        // In auto mode, automatically proceed to next agent
        if (conversationOptions.mode === 'auto') {
          logger.info('useConversation', 'useEffect', 'Auto mode - proceeding to next agent');
          proceedToNextAgent();
        } else {
          logger.info('useConversation', 'useEffect', 'Manual mode - waiting for user to proceed');
          // In manual mode, don't automatically proceed - wait for user action
        }
      }
    }
  }, [agentStepStates, state.isActive, state.currentAgentId, state.status, state.currentStep, state.totalSteps, conversationOptions.mode, proceedToNextAgent]);

  // Retry current agent
  const retryCurrentAgent = useCallback(async () => {
    if (!state.currentAgentId) {
      return;
    }

    const retryCount = retryCountRef.current[state.currentAgentId] || 0;
    if (retryCount >= options.maxRetries) {
      setState(prev => ({
        ...prev,
        status: 'error',
        error: `Maximum retries (${options.maxRetries}) exceeded for agent ${state.currentAgentId}`
      }));
      return;
    }

    retryCountRef.current[state.currentAgentId] = retryCount + 1;

    logger.info('useConversation', 'retryCurrentAgent', `Retrying agent ${state.currentAgentId} (attempt ${retryCount + 1})`);

    // Reset agent state to idle
    updateAgentState(state.currentAgentId, 'Idle');

    // Reset step state
    if (state.currentAgentId !== null) {
      setAgentStepStates(prev => ({
        ...prev,
        [state.currentAgentId as number]: {
          enabled: false,
          complete: false,
          currentSubStep: 'prompt_draft',
          promptDraftEnabled: false,
          promptDraftComplete: false,
          promptOkEnabled: false,
          promptOkComplete: false,
          generatingEnabled: false,
          generatingComplete: false,
          responseDraftEnabled: false,
          responseDraftComplete: false,
          responseOkEnabled: false,
          responseOkComplete: false
        }
      }));
    }

    // Remove the failed entry from conversation history
    setState(prev => ({
      ...prev,
      conversationHistory: prev.conversationHistory.filter(
        entry => entry.agentId !== state.currentAgentId
      ),
      status: 'running',
      error: null
    }));

    // Retry the current agent
    await processCurrentAgent();
  }, [state.currentAgentId, options.maxRetries, processCurrentAgent, updateAgentState]);

  // Pause conversation
  const pauseConversation = useCallback(() => {
    if (state.isActive && state.status === 'running') {
      setState(prev => ({ ...prev, status: 'paused' }));
      logger.info('useConversation', 'pauseConversation', 'Conversation paused');
    }
  }, [state.isActive, state.status]);

  // Resume conversation
  const resumeConversation = useCallback(() => {
    if (state.isActive && state.status === 'paused') {
      setState(prev => ({ ...prev, status: 'running' }));
      logger.info('useConversation', 'resumeConversation', 'Conversation resumed');
      
      // Continue with current agent if it was pending
      const currentEntry = state.conversationHistory.find(
        entry => entry.agentId === state.currentAgentId
      );
      
      if (currentEntry?.status === 'pending') {
        processCurrentAgent();
      }
    }
  }, [state, processCurrentAgent]);

  // Stop conversation
  const stopConversation = useCallback(() => {
    setState(prev => ({
      ...prev,
      isActive: false,
      status: 'idle',
      currentAgentId: null,
      currentStep: 0
    }));
    logger.info('useConversation', 'stopConversation', 'Conversation stopped');
  }, []);

  // Approve response (mark as reviewed)
  const approveResponse = useCallback((agentId: number) => {
    completeSubStep(agentId, 'responseDraftComplete');
    enableSubStep(agentId, 'responseOkEnabled');
    updateAgentState(agentId, 'Active.Response_OK', { responseApproved: true });
    updateAgentState(agentId, 'Complete');
    
    setState(prev => ({
      ...prev,
      conversationHistory: prev.conversationHistory.map(entry =>
        entry.agentId === agentId
          ? { ...entry, status: 'reviewed' }
          : entry
      )
    }));
    logger.info('useConversation', 'approveResponse', `Response approved for agent ${agentId}`);
  }, [updateAgentState, completeSubStep, enableSubStep]);

  // Reject response
  const rejectResponse = useCallback((agentId: number, reason: string) => {
    updateAgentState(agentId, 'Idle');
    
    setState(prev => ({
      ...prev,
      conversationHistory: prev.conversationHistory.map(entry =>
        entry.agentId === agentId
          ? { ...entry, response: `Rejected: ${reason}`, status: 'failed' }
          : entry
      )
    }));
    logger.info('useConversation', 'rejectResponse', `Response rejected for agent ${agentId}: ${reason}`);
  }, [updateAgentState]);

  // Edit response
  const editResponse = useCallback((agentId: number, editedResponse: string) => {
    updateAgentState(agentId, 'Active.Response_Draft', { currentResponse: editedResponse });
    
    setState(prev => ({
      ...prev,
      conversationHistory: prev.conversationHistory.map(entry =>
        entry.agentId === agentId
          ? { ...entry, response: editedResponse, status: 'reviewed' }
          : entry
      )
    }));
    logger.info('useConversation', 'editResponse', `Response edited for agent ${agentId}`);
  }, [updateAgentState]);

  // Get current agent
  const getCurrentAgent = useCallback((): AgentConfiguration | null => {
    if (!state.currentAgentId) return null;
    return agentsRef.current.find(a => a.id === state.currentAgentId) || null;
  }, [state.currentAgentId]);

  // Get conversation progress
  const getProgress = useCallback(() => {
    if (state.totalSteps === 0) return 0;
    const completedAgents = Object.values(agentStepStates).filter(
      stepState => stepState.complete
    ).length;
    return (completedAgents / state.totalSteps) * 100;
  }, [agentStepStates, state.totalSteps]);

  // Get conversation summary
  const getConversationSummary = useCallback(() => {
    const completed = Object.values(agentStepStates).filter(
      stepState => stepState.complete
    ).length;
    const failed = state.conversationHistory.filter(entry => entry.status === 'failed').length;
    const pending = Object.values(state.agentStates).filter(
      agentState => agentState.state === 'Active.Generating'
    ).length;

    return {
      total: state.totalSteps,
      completed,
      failed,
      pending,
      progress: getProgress(),
      status: state.status
    };
  }, [state, getProgress, agentStepStates]);

  return {
    // State
    state,
    
    // Actions
    startConversation,
    pauseConversation,
    resumeConversation,
    stopConversation,
    proceedToNextAgent,
    retryCurrentAgent,
    approvePrompt,
    approveResponse,
    rejectResponse,
    editResponse,
    editPrompt,
    toggleMode,
    
    // Utilities
    getCurrentAgent,
    getProgress,
    getConversationSummary
  };
}; 