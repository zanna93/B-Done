import type { LucideIcon } from "lucide-react";

export interface NavItem<T extends string> {
  id: T;
  label: string;
  icon: LucideIcon;
}

interface BottomNavProps<T extends string> {
  items: Array<NavItem<T>>;
  activeId: T;
  onChange: (id: T) => void;
}

export function BottomNav<T extends string>({ items, activeId, onChange }: BottomNavProps<T>) {
  return (
    <nav className="bottom-nav" aria-label="Navigazione principale">
      {items.map((item) => {
        const Icon = item.icon;
        const active = item.id === activeId;
        return (
          <button
            className="bottom-nav__item"
            type="button"
            key={item.id}
            aria-current={active ? "page" : undefined}
            onClick={() => onChange(item.id)}
          >
            <Icon aria-hidden="true" size={21} strokeWidth={2.2} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
