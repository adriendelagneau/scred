// components/form-error.tsx
import React from "react";

type FormErrorProps = {
  message?: string | null;
};

const FormError: React.FC<FormErrorProps> = ({ message }) => {
  if (!message) return null;

  return (
    <p className="mt-2 text-sm text-red-600" role="alert" aria-live="assertive">
      {message}
    </p>
  );
};

export default FormError;
