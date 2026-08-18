"use client";

import { useState } from "react";
import { ArrowUp, Archive } from "lucide-react";


const PLACEHOLDER = "anything that makes you smile today...";

export function StashComposer() {
  const [value, setValue] = useState("");

  return (
    <section className="w-full max-w-2xl">
      <div className="text-center">
        <div className="flex items-center justify-center gap-2">
          <Archive className="size-8.5 text-primary" aria-hidden="true" />
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            How&rsquo;s your day going?
          </h1>
        </div>
        <p className="mt-2 text-sm text-muted-foreground sm:text-base">
         Capture anything you&rsquo;ll want back later.
        </p>
      </div>

      <div className="mt-8 rounded-3xl border border-border bg-card p-2 transition-colors focus-within:border-primary dark:focus-within:border-primary">
        <textarea
          value={value}
          onChange={(event) => setValue(event.target.value)}
          rows={3}
          placeholder={PLACEHOLDER}
          aria-label={PLACEHOLDER}
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
    </section>
  );
}
