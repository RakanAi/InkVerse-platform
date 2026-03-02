export default function Surface({ className = "", children, ...props }) {
  return (
    <div className={`iv-surface ${className}`.trim()} {...props}>
      {children}
    </div>
  );
}