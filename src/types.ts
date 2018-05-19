export interface PaypalPayload {
  paypalId: string;
  user: string;
}

export interface CallerPayload {
  paypalId?: string;
  destination: string;
}
