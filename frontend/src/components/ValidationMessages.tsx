interface ValidationMessagesProps {
  errors?: string | string[] | Record<string, string | string[]>;
}

function formatMessages(
  errors?: string | string[] | Record<string, string | string[]>,
): string[] {
  if (!errors) {
    return [];
  }

  if (typeof errors === 'string') {
    return [errors];
  }

  if (Array.isArray(errors)) {
    return errors.flatMap((item) => (typeof item === 'string' ? item : JSON.stringify(item)));
  }

  return Object.entries(errors).flatMap(([key, value]) => {
    if (Array.isArray(value)) {
      return value;
    }
    return `${key.replace('_', ' ')}: ${value}`;
  });
}

export default function ValidationMessages({ errors }: ValidationMessagesProps) {
  const messages = formatMessages(errors);

  if (!messages.length) {
    return null;
  }

  return (
    <div className="error-box" role="alert">
      <ul>
        {messages.map((message, index) => (
          <li key={index}>{message}</li>
        ))}
      </ul>
    </div>
  );
}
