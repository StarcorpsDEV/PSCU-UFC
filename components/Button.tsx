type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

export const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  type = 'button',
  ...extraProps
}) => {
  return (
    <button
      type={type}
      style={{
        backgroundColor: '#ca9627',
        color: '#fff',
        borderRadius: '8px',
        border: 'none',
        padding: '0.25rem 0.5rem',
        cursor: 'pointer',
      }}
      onClick={onClick}
      {...extraProps}
    >
      {children}
    </button>
  );
};
