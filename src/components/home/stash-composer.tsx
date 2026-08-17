"use client";

import { useState } from "react";
import { ArrowUp } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  CATEGORIES,
  CATEGORY_ICONS,
  CATEGORY_LABELS,
  type Category,
} from "@/types/category";

const CATEGORY_PROMPTS: Record<Category, string> = {
  VIDEO: "What did you watch?",
  READING: "What did you read?",
  GAMING: "What did you play?",
  AUDIO: "What did you listen to?",
  LIFE_MOMENTS: "What happened today?",
};

const DEFAULT_PROMPT = "What do you want to remember?";

export function StashComposer() {
  const [selected, setSelected] = useState<Category | null>(null);
  const [value, setValue] = useState("");

  const placeholder = selected ? CATEGORY_PROMPTS[selected] : DEFAULT_PROMPT;

  return (
    <section className="w-full max-w-2xl">
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          What&rsquo;s worth keeping?
        </h1>
        <p className="mt-2 text-sm text-muted-foreground sm:text-base">
         anything you&rsquo;ll want back later.
        </p>
      </div>

      <div className="mt-8 rounded-3xl border border-border bg-card p-2 transition-colors focus-within:border-primary">
        <textarea
          value={value}
          onChange={(event) => setValue(event.target.value)}
          rows={3}
          placeholder={placeholder}
          aria-label={placeholder}
          className="w-full resize-none bg-transparent px-4 pt-3 text-base text-foreground placeholder:text-muted-foreground outline-none"
        />
        <div className="flex justify-end px-2 pb-1">
          <button
            type="button"
            disabled={value.trim().length === 0}
            aria-label="Save to your stash"
            className="flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ArrowUp className="size-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {CATEGORIES.map((category) => {
          const Icon = CATEGORY_ICONS[category];
          const isSelected = selected === category;

          return (
            <button
              key={category}
              type="button"
              aria-pressed={isSelected}
              onClick={() => setSelected(isSelected ? null : category)}
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
                isSelected
                  ? "border-secondary/60 bg-secondary/10 text-secondary"
                  : "border-border text-muted-foreground hover:border-muted-foreground/50 hover:text-foreground"
              )}
            >
              <Icon className="size-4" aria-hidden="true" />
              {CATEGORY_LABELS[category]}
            </button>
          );
        })}
      </div>
    </section>
  );
}
