import { useEffect } from "react";

/** Inserta datos estructurados (schema.org) en <head> mientras la página está montada. */
export function JsonLd({ data }: { data: object }) {
  const json = JSON.stringify(data);
  useEffect(() => {
    const el = document.createElement("script");
    el.type = "application/ld+json";
    el.textContent = json;
    document.head.appendChild(el);
    return () => el.remove();
  }, [json]);
  return null;
}
