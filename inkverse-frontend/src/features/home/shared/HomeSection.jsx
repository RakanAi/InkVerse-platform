import PageHeader from "@/Shared/ui/PageHeader";

export default function HomeSection({
  title,
  subtitle,
  actions,
  className = "",
  headerVariant = "default",
  children,
  ...props
}) {
  const sectionClassName = ["iv-home-section", className].filter(Boolean).join(" ");

  return (
    <section className={sectionClassName} {...props}>
      {(title || subtitle || actions) ? (
        <PageHeader
          title={title}
          subtitle={subtitle}
          actions={actions}
          variant={headerVariant}
        />
      ) : null}
      {children}
    </section>
  );
}
