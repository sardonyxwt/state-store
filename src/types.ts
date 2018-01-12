export type ListenerEventType = { newScope: any, oldScope: any, actionId: string };
export type ListenerType = (event: ListenerEventType) => void;
export type ActionType = (
  scope: any,
  props: any,
  resolved: (newScope: any) => void
) => void;
export type Action = { scopeId: string, func: ActionType };
export type Listener = { scopeId: string, func: ListenerType };
