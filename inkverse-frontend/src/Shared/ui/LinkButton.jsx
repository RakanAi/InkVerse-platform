import React from "react";
import { Link } from "react-router-dom";

// Same visual system as <Button />, but navigates using React Router <Link />.
// Usage: <LinkButton to="/Browser" variant="ghost">See all →</LinkButton>
export default function LinkButton({
  to,
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...props
}) {
  const classes = ["iv-btn", `iv-btn-${variant}`, `iv-btn-${size}`, className]
    .filter(Boolean)
    .join(" ");

  return (
    <Link to={to} className={classes} {...props}>
      {children}
    </Link>
  );
}
