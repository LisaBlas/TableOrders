import { S } from "../styles/appStyles";

interface ToastProps {
  message: string;
}

export function Toast({ message }: ToastProps) {
  return <div style={S.toast}>{message}</div>;
}
