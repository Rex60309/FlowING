"use client";

import { useEffect } from "react";

export function SelectEnhancer() {
  useEffect(() => {
    const cleanups: Array<() => void> = [];
    document.querySelectorAll<HTMLSelectElement>("select:not([data-enhanced])").forEach((select) => {
      select.dataset.enhanced = "true";
      select.classList.add("enhanced-native");
      const wrapper = document.createElement("div"); wrapper.className = "custom-select";
      const trigger = document.createElement("button"); trigger.type = "button"; trigger.className = "select-trigger";
      const menu = document.createElement("div"); menu.className = "select-menu"; menu.setAttribute("role", "listbox");
      const refresh = () => { trigger.textContent = select.options[select.selectedIndex]?.text ?? "請選擇"; menu.querySelectorAll<HTMLButtonElement>(".select-option").forEach((item, index) => item.classList.toggle("selected", index === select.selectedIndex)); };
      Array.from(select.options).forEach((option, index) => { const item = document.createElement("button"); item.type = "button"; item.className = "select-option"; item.textContent = option.text; item.setAttribute("role", "option"); item.addEventListener("click", () => { select.selectedIndex = index; select.dispatchEvent(new Event("change", { bubbles: true })); refresh(); wrapper.classList.remove("open"); }); menu.append(item); });
      const toggle = () => { document.querySelectorAll(".custom-select.open").forEach((node) => { if (node !== wrapper) node.classList.remove("open"); }); wrapper.classList.toggle("open"); };
      trigger.addEventListener("click", toggle); select.addEventListener("change", refresh); select.after(wrapper); wrapper.append(trigger, menu); refresh();
      cleanups.push(() => { trigger.removeEventListener("click", toggle); select.removeEventListener("change", refresh); wrapper.remove(); select.classList.remove("enhanced-native"); delete select.dataset.enhanced; });
    });
    const close = (event: MouseEvent) => { if (!(event.target as Element).closest(".custom-select")) document.querySelectorAll(".custom-select.open").forEach((node) => node.classList.remove("open")); };
    document.addEventListener("click", close);
    return () => { document.removeEventListener("click", close); cleanups.forEach((cleanup) => cleanup()); };
  });
  return null;
}
