import React, { useState } from "react";
import { createRecipeFromAccess } from "@/lib/strapi";

export default function ExternalRecipesAdmin() {
  const [name, setName] = useState("");
  const [link, setLink] = useState("");
  const [desc, setDesc] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const form = new FormData();
    form.append("data", JSON.stringify({ name, link, shortDescription: desc }));
    const res = await createRecipeFromAccess(form as any);
    setBusy(false);
    if (res.ok) setMsg("Created OK");
    else setMsg(`Error: ${res.error}`);
  };

  return (
    <form data-testid="external-admin-form" onSubmit={submit} className="space-y-3">
      <div>
        <label className="block text-sm">Name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} className="w-full" />
      </div>
      <div>
        <label className="block text-sm">Link</label>
        <input value={link} onChange={(e) => setLink(e.target.value)} className="w-full" />
      </div>
      <div>
        <label className="block text-sm">Short description</label>
        <textarea value={desc} onChange={(e) => setDesc(e.target.value)} className="w-full" />
      </div>
      <div>
        <button disabled={busy} className="btn">
          {busy ? "Creating…" : "Create"}
        </button>
      </div>
      {msg && <div className="text-sm">{msg}</div>}
    </form>
  );
}
