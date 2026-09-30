export default function StatusMessage({ message }) {
  if (!message) return null;

  return <div className="status-message">{message}</div>;
}
