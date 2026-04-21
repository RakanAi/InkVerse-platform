import Surface from "../../Shared/ui/Surface";

export default function AuthorContract() {
  return (
    <div className="authorx-page">
      <section className="authorx-hero">
        <div>
          <h1>Contract & Terms</h1>
          <p>Manage your author agreement status and upcoming contract updates.</p>
        </div>
      </section>

      <Surface>
        <div className="authorx-section-head">
          <h3>Current Contract Status</h3>
        </div>
        <div className="authorx-contract-status success">Active - Author agreement accepted</div>
        <p className="authorx-contract-note">
          This is the temporary contract module. You can replace this section later
          with your legal terms versioning, acceptance history, and payout policy details.
        </p>
      </Surface>
    </div>
  );
}