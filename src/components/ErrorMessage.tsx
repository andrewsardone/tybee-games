import { FC } from 'hono/jsx';

interface ErrorMessageProps {
  message?: string;
}

const ErrorMessage: FC<ErrorMessageProps> = ({
  message = 'Failed to load games. Please try again.',
}) => {
  return <div className="error">{message}</div>;
};

export default ErrorMessage;
