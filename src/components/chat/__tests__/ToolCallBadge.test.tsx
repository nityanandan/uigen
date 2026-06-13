import { render, screen, cleanup } from "@testing-library/react";
import { afterEach, test, expect } from "vitest";
import { ToolCallBadge } from "../ToolCallBadge";

afterEach(() => cleanup());

test("str_replace_editor create while pending shows spinner", () => {
  const { container } = render(
    <ToolCallBadge
      toolName="str_replace_editor"
      args={{ command: "create", path: "/App.jsx" }}
      state="call"
    />
  );
  expect(screen.getByText("Creating /App.jsx")).toBeDefined();
  expect(container.querySelector(".animate-spin")).toBeDefined();
  expect(container.querySelector(".bg-emerald-500")).toBeNull();
});

test("str_replace_editor create with result shows green dot", () => {
  const { container } = render(
    <ToolCallBadge
      toolName="str_replace_editor"
      args={{ command: "create", path: "/App.jsx" }}
      state="result"
      result="Success"
    />
  );
  expect(screen.getByText("Creating /App.jsx")).toBeDefined();
  expect(container.querySelector(".bg-emerald-500")).toBeDefined();
  expect(container.querySelector(".animate-spin")).toBeNull();
});

test("str_replace_editor str_replace shows editing label", () => {
  render(
    <ToolCallBadge
      toolName="str_replace_editor"
      args={{ command: "str_replace", path: "/Card.jsx" }}
      state="call"
    />
  );
  expect(screen.getByText("Editing /Card.jsx")).toBeDefined();
});

test("str_replace_editor insert shows editing label", () => {
  render(
    <ToolCallBadge
      toolName="str_replace_editor"
      args={{ command: "insert", path: "/Button.tsx" }}
      state="call"
    />
  );
  expect(screen.getByText("Editing /Button.tsx")).toBeDefined();
});

test("str_replace_editor view shows reading label", () => {
  render(
    <ToolCallBadge
      toolName="str_replace_editor"
      args={{ command: "view", path: "/App.jsx" }}
      state="call"
    />
  );
  expect(screen.getByText("Reading /App.jsx")).toBeDefined();
});

test("str_replace_editor undo_edit shows undo label", () => {
  render(
    <ToolCallBadge
      toolName="str_replace_editor"
      args={{ command: "undo_edit", path: "/App.jsx" }}
      state="call"
    />
  );
  expect(screen.getByText("Undoing edit in /App.jsx")).toBeDefined();
});

test("file_manager delete shows deleting label", () => {
  render(
    <ToolCallBadge
      toolName="file_manager"
      args={{ command: "delete", path: "/old.jsx" }}
      state="call"
    />
  );
  expect(screen.getByText("Deleting /old.jsx")).toBeDefined();
});

test("file_manager rename shows renaming label", () => {
  render(
    <ToolCallBadge
      toolName="file_manager"
      args={{ command: "rename", path: "/a.jsx", new_path: "/b.jsx" }}
      state="call"
    />
  );
  expect(screen.getByText("Renaming /a.jsx → /b.jsx")).toBeDefined();
});

test("unknown tool name falls back to tool name", () => {
  render(
    <ToolCallBadge
      toolName="some_unknown_tool"
      args={{ command: "something" }}
      state="call"
    />
  );
  expect(screen.getByText("some_unknown_tool")).toBeDefined();
});

test("missing args falls back to tool name", () => {
  render(
    <ToolCallBadge
      toolName="str_replace_editor"
      args={{}}
      state="call"
    />
  );
  expect(screen.getByText("str_replace_editor")).toBeDefined();
});
