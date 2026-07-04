import { AlertTriangle } from "lucide-react";
import type { ValidationIssue } from "../../domain/models";

interface DataIssuePanelProps {
  issues: ValidationIssue[];
}

export function DataIssuePanel({ issues }: DataIssuePanelProps) {
  return (
    <main className="error-screen">
      <section className="panel">
        <div className="section-title">
          <AlertTriangle aria-hidden="true" />
          <div>
            <p className="eyebrow">Dati da sistemare</p>
            <h1>B-Done non può leggere i CSV</h1>
          </div>
        </div>
        <ul className="issue-list">
          {issues.map((issue, index) => (
            <li key={`${issue.file}-${issue.line}-${index}`}>
              <strong>{issue.file}</strong>, riga {issue.line}: {issue.message}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
