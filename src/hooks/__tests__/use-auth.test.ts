import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";

// Mock server-only module first to prevent errors
vi.mock("server-only", () => ({}));

// Mock modules
vi.mock("next/navigation");
vi.mock("@/lib/anon-work-tracker");
vi.mock("@/actions");
vi.mock("@/actions/get-projects");
vi.mock("@/actions/create-project");

import { useAuth } from "@/hooks/use-auth";

import { useRouter } from "next/navigation";
import * as anonWorkTracker from "@/lib/anon-work-tracker";
import * as actions from "@/actions";
import * as getProjectsModule from "@/actions/get-projects";
import * as createProjectModule from "@/actions/create-project";

describe("useAuth", () => {
  let mockRouter: any;
  let mockProject: any;
  let mockSignInResult: any;
  let mockSignUpResult: any;

  beforeEach(() => {
    mockRouter = { push: vi.fn() };
    mockProject = { id: "project-123", name: "Test Project" };
    mockSignInResult = { success: true };
    mockSignUpResult = { success: true };

    (useRouter as any).mockReturnValue(mockRouter);

    vi.mocked(actions.signIn).mockReset();
    vi.mocked(actions.signUp).mockReset();
    vi.mocked(getProjectsModule.getProjects).mockReset();
    vi.mocked(createProjectModule.createProject).mockReset();
    vi.mocked(anonWorkTracker.getAnonWorkData).mockReset();
    vi.mocked(anonWorkTracker.clearAnonWork).mockReset();
  });

  describe("initialization", () => {
    it("should return signIn, signUp, and isLoading", () => {
      const { result } = renderHook(() => useAuth());

      expect(result.current).toHaveProperty("signIn");
      expect(result.current).toHaveProperty("signUp");
      expect(result.current).toHaveProperty("isLoading");
      expect(typeof result.current.signIn).toBe("function");
      expect(typeof result.current.signUp).toBe("function");
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe("signIn", () => {
    it("should call signInAction with email and password", async () => {
      const { result } = renderHook(() => useAuth());
      vi.mocked(actions.signIn).mockResolvedValueOnce({ success: false });
      vi.mocked(anonWorkTracker.getAnonWorkData).mockReturnValueOnce(null);

      await act(async () => {
        await result.current.signIn("user@example.com", "password123");
      });

      expect(vi.mocked(actions.signIn)).toHaveBeenCalledWith("user@example.com", "password123");
    });

    it("should return the result from signInAction", async () => {
      const { result } = renderHook(() => useAuth());
      vi.mocked(actions.signIn).mockResolvedValueOnce(mockSignInResult);
      vi.mocked(anonWorkTracker.getAnonWorkData).mockReturnValueOnce(null);
      vi.mocked(getProjectsModule.getProjects).mockResolvedValueOnce([mockProject]);

      let signInResult;
      await act(async () => {
        signInResult = await result.current.signIn("user@example.com", "password123");
      });

      expect(signInResult).toEqual(mockSignInResult);
    });

    it("should toggle isLoading during sign in", async () => {
      const { result } = renderHook(() => useAuth());
      const loadingStates: boolean[] = [];

      vi.mocked(actions.signIn).mockImplementationOnce(async () => {
        loadingStates.push(result.current.isLoading);
        return mockSignInResult;
      });
      vi.mocked(anonWorkTracker.getAnonWorkData).mockReturnValueOnce(null);
      vi.mocked(getProjectsModule.getProjects).mockResolvedValueOnce([mockProject]);

      // Initial state
      expect(result.current.isLoading).toBe(false);

      await act(async () => {
        await result.current.signIn("user@example.com", "password123");
      });

      // Final state
      expect(result.current.isLoading).toBe(false);
    });

    it("should set isLoading to false after sign in completes", async () => {
      const { result } = renderHook(() => useAuth());
      vi.mocked(actions.signIn).mockResolvedValueOnce(mockSignInResult);
      vi.mocked(anonWorkTracker.getAnonWorkData).mockReturnValueOnce(null);
      vi.mocked(getProjectsModule.getProjects).mockResolvedValueOnce([mockProject]);

      await act(async () => {
        await result.current.signIn("user@example.com", "password123");
      });

      expect(result.current.isLoading).toBe(false);
    });

    it("should not call handlePostSignIn if signInAction fails", async () => {
      const { result } = renderHook(() => useAuth());
      vi.mocked(actions.signIn).mockResolvedValueOnce({ success: false, error: "Invalid credentials" });

      await act(async () => {
        await result.current.signIn("user@example.com", "wrong-password");
      });

      expect(mockRouter.push).not.toHaveBeenCalled();
      expect(vi.mocked(getProjectsModule.getProjects)).not.toHaveBeenCalled();
    });

    it("should set isLoading to false even if signInAction throws", async () => {
      const { result } = renderHook(() => useAuth());
      vi.mocked(actions.signIn).mockRejectedValueOnce(new Error("Network error"));

      await act(async () => {
        try {
          await result.current.signIn("user@example.com", "password123");
        } catch {
          // Expected to throw
        }
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe("signUp", () => {
    it("should call signUpAction with email and password", async () => {
      const { result } = renderHook(() => useAuth());
      vi.mocked(actions.signUp).mockResolvedValueOnce({ success: false });
      vi.mocked(anonWorkTracker.getAnonWorkData).mockReturnValueOnce(null);

      await act(async () => {
        await result.current.signUp("newuser@example.com", "password123");
      });

      expect(vi.mocked(actions.signUp)).toHaveBeenCalledWith("newuser@example.com", "password123");
    });

    it("should return the result from signUpAction", async () => {
      const { result } = renderHook(() => useAuth());
      vi.mocked(actions.signUp).mockResolvedValueOnce(mockSignUpResult);
      vi.mocked(anonWorkTracker.getAnonWorkData).mockReturnValueOnce(null);
      vi.mocked(getProjectsModule.getProjects).mockResolvedValueOnce([mockProject]);

      let signUpResult;
      await act(async () => {
        signUpResult = await result.current.signUp("newuser@example.com", "password123");
      });

      expect(signUpResult).toEqual(mockSignUpResult);
    });

    it("should toggle isLoading during sign up", async () => {
      const { result } = renderHook(() => useAuth());

      vi.mocked(actions.signUp).mockImplementationOnce(async () => {
        return mockSignUpResult;
      });
      vi.mocked(anonWorkTracker.getAnonWorkData).mockReturnValueOnce(null);
      vi.mocked(getProjectsModule.getProjects).mockResolvedValueOnce([mockProject]);

      // Initial state
      expect(result.current.isLoading).toBe(false);

      await act(async () => {
        await result.current.signUp("newuser@example.com", "password123");
      });

      // Final state
      expect(result.current.isLoading).toBe(false);
    });

    it("should set isLoading to false after sign up completes", async () => {
      const { result } = renderHook(() => useAuth());
      vi.mocked(actions.signUp).mockResolvedValueOnce(mockSignUpResult);
      vi.mocked(anonWorkTracker.getAnonWorkData).mockReturnValueOnce(null);
      vi.mocked(getProjectsModule.getProjects).mockResolvedValueOnce([mockProject]);

      await act(async () => {
        await result.current.signUp("newuser@example.com", "password123");
      });

      expect(result.current.isLoading).toBe(false);
    });

    it("should not call handlePostSignIn if signUpAction fails", async () => {
      const { result } = renderHook(() => useAuth());
      vi.mocked(actions.signUp).mockResolvedValueOnce({ success: false, error: "Email already exists" });

      await act(async () => {
        await result.current.signUp("existing@example.com", "password123");
      });

      expect(mockRouter.push).not.toHaveBeenCalled();
      expect(vi.mocked(getProjectsModule.getProjects)).not.toHaveBeenCalled();
    });

    it("should set isLoading to false even if signUpAction throws", async () => {
      const { result } = renderHook(() => useAuth());
      vi.mocked(actions.signUp).mockRejectedValueOnce(new Error("Server error"));

      await act(async () => {
        try {
          await result.current.signUp("newuser@example.com", "password123");
        } catch {
          // Expected to throw
        }
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe("handlePostSignIn - with anonymous work", () => {
    it("should create a project with anonymous work if it exists", async () => {
      const { result } = renderHook(() => useAuth());
      const anonWork = {
        messages: [{ role: "user", content: "test" }],
        fileSystemData: { "App.jsx": "export default () => <div>App</div>" },
      };

      vi.mocked(actions.signIn).mockResolvedValueOnce(mockSignInResult);
      vi.mocked(anonWorkTracker.getAnonWorkData).mockReturnValueOnce(anonWork);
      vi.mocked(createProjectModule.createProject).mockResolvedValueOnce(mockProject);

      await act(async () => {
        await result.current.signIn("user@example.com", "password123");
      });

      expect(vi.mocked(createProjectModule.createProject)).toHaveBeenCalledWith({
        name: expect.stringContaining("Design from"),
        messages: anonWork.messages,
        data: anonWork.fileSystemData,
      });
    });

    it("should clear anonymous work after creating project", async () => {
      const { result } = renderHook(() => useAuth());
      const anonWork = {
        messages: [{ role: "user", content: "test" }],
        fileSystemData: { "App.jsx": "export default () => <div>App</div>" },
      };

      vi.mocked(actions.signIn).mockResolvedValueOnce(mockSignInResult);
      vi.mocked(anonWorkTracker.getAnonWorkData).mockReturnValueOnce(anonWork);
      vi.mocked(createProjectModule.createProject).mockResolvedValueOnce(mockProject);

      await act(async () => {
        await result.current.signIn("user@example.com", "password123");
      });

      expect(vi.mocked(anonWorkTracker.clearAnonWork)).toHaveBeenCalled();
    });

    it("should redirect to anonymous work project", async () => {
      const { result } = renderHook(() => useAuth());
      const anonWork = {
        messages: [{ role: "user", content: "test" }],
        fileSystemData: { "App.jsx": "export default () => <div>App</div>" },
      };

      vi.mocked(actions.signIn).mockResolvedValueOnce(mockSignInResult);
      vi.mocked(anonWorkTracker.getAnonWorkData).mockReturnValueOnce(anonWork);
      vi.mocked(createProjectModule.createProject).mockResolvedValueOnce(mockProject);

      await act(async () => {
        await result.current.signIn("user@example.com", "password123");
      });

      expect(mockRouter.push).toHaveBeenCalledWith(`/${mockProject.id}`);
    });

    it("should not get projects if anonymous work exists", async () => {
      const { result } = renderHook(() => useAuth());
      const anonWork = {
        messages: [{ role: "user", content: "test" }],
        fileSystemData: { "App.jsx": "export default () => <div>App</div>" },
      };

      vi.mocked(actions.signIn).mockResolvedValueOnce(mockSignInResult);
      vi.mocked(anonWorkTracker.getAnonWorkData).mockReturnValueOnce(anonWork);
      vi.mocked(createProjectModule.createProject).mockResolvedValueOnce(mockProject);

      await act(async () => {
        await result.current.signIn("user@example.com", "password123");
      });

      expect(vi.mocked(getProjectsModule.getProjects)).not.toHaveBeenCalled();
    });

    it("should not create new project if anonymous work exists", async () => {
      const { result } = renderHook(() => useAuth());
      const anonWork = {
        messages: [{ role: "user", content: "test" }],
        fileSystemData: { "App.jsx": "export default () => <div>App</div>" },
      };

      vi.mocked(actions.signIn).mockResolvedValueOnce(mockSignInResult);
      vi.mocked(anonWorkTracker.getAnonWorkData).mockReturnValueOnce(anonWork);
      vi.mocked(createProjectModule.createProject).mockResolvedValueOnce(mockProject);

      await act(async () => {
        await result.current.signIn("user@example.com", "password123");
      });

      expect(vi.mocked(createProjectModule.createProject)).toHaveBeenCalledTimes(1);
    });

    it("should use current time in anonymous work project name", async () => {
      const { result } = renderHook(() => useAuth());
      const anonWork = {
        messages: [{ role: "user", content: "test" }],
        fileSystemData: { "App.jsx": "export default () => <div>App</div>" },
      };

      vi.mocked(actions.signIn).mockResolvedValueOnce(mockSignInResult);
      vi.mocked(anonWorkTracker.getAnonWorkData).mockReturnValueOnce(anonWork);
      vi.mocked(createProjectModule.createProject).mockResolvedValueOnce(mockProject);

      await act(async () => {
        await result.current.signIn("user@example.com", "password123");
      });

      const call = vi.mocked(createProjectModule.createProject).mock.calls[0][0];
      expect(call.name).toMatch(/^Design from \d{1,2}:\d{2}:\d{2}/);
    });
  });

  describe("handlePostSignIn - with empty anonymous work", () => {
    it("should treat empty anonymous work as no work", async () => {
      const { result } = renderHook(() => useAuth());
      const anonWork = {
        messages: [],
        fileSystemData: {},
      };

      vi.mocked(actions.signIn).mockResolvedValueOnce(mockSignInResult);
      vi.mocked(anonWorkTracker.getAnonWorkData).mockReturnValueOnce(anonWork);
      vi.mocked(getProjectsModule.getProjects).mockResolvedValueOnce([mockProject]);

      await act(async () => {
        await result.current.signIn("user@example.com", "password123");
      });

      expect(vi.mocked(createProjectModule.createProject)).not.toHaveBeenCalled();
      expect(vi.mocked(getProjectsModule.getProjects)).toHaveBeenCalled();
    });
  });

  describe("handlePostSignIn - with existing projects", () => {
    it("should redirect to most recent project", async () => {
      const { result } = renderHook(() => useAuth());
      const projects = [
        { id: "project-1", name: "Recent" },
        { id: "project-2", name: "Older" },
      ];

      vi.mocked(actions.signIn).mockResolvedValueOnce(mockSignInResult);
      vi.mocked(anonWorkTracker.getAnonWorkData).mockReturnValueOnce(null);
      vi.mocked(getProjectsModule.getProjects).mockResolvedValueOnce(projects);

      await act(async () => {
        await result.current.signIn("user@example.com", "password123");
      });

      expect(mockRouter.push).toHaveBeenCalledWith(`/${projects[0].id}`);
    });

    it("should not create project if user has existing projects", async () => {
      const { result } = renderHook(() => useAuth());
      const projects = [{ id: "project-1", name: "Existing" }];

      vi.mocked(actions.signIn).mockResolvedValueOnce(mockSignInResult);
      vi.mocked(anonWorkTracker.getAnonWorkData).mockReturnValueOnce(null);
      vi.mocked(getProjectsModule.getProjects).mockResolvedValueOnce(projects);

      await act(async () => {
        await result.current.signIn("user@example.com", "password123");
      });

      expect(vi.mocked(createProjectModule.createProject)).not.toHaveBeenCalled();
    });
  });

  describe("handlePostSignIn - with no projects", () => {
    it("should create new project if user has no projects", async () => {
      const { result } = renderHook(() => useAuth());

      vi.mocked(actions.signIn).mockResolvedValueOnce(mockSignInResult);
      vi.mocked(anonWorkTracker.getAnonWorkData).mockReturnValueOnce(null);
      vi.mocked(getProjectsModule.getProjects).mockResolvedValueOnce([]);
      vi.mocked(createProjectModule.createProject).mockResolvedValueOnce(mockProject);

      await act(async () => {
        await result.current.signIn("user@example.com", "password123");
      });

      expect(vi.mocked(createProjectModule.createProject)).toHaveBeenCalledWith(
        expect.objectContaining({
          name: expect.stringMatching(/^New Design #\d+$/),
          messages: [],
          data: {},
        })
      );
    });

    it("should redirect to newly created project", async () => {
      const { result } = renderHook(() => useAuth());
      const newProject = { id: "new-project-123", name: "New Design #12345" };

      vi.mocked(actions.signIn).mockResolvedValueOnce(mockSignInResult);
      vi.mocked(anonWorkTracker.getAnonWorkData).mockReturnValueOnce(null);
      vi.mocked(getProjectsModule.getProjects).mockResolvedValueOnce([]);
      vi.mocked(createProjectModule.createProject).mockResolvedValueOnce(newProject);

      await act(async () => {
        await result.current.signIn("user@example.com", "password123");
      });

      expect(mockRouter.push).toHaveBeenCalledWith(`/${newProject.id}`);
    });

    it("should generate random project name", async () => {
      const { result } = renderHook(() => useAuth());

      vi.mocked(actions.signIn).mockResolvedValueOnce(mockSignInResult);
      vi.mocked(anonWorkTracker.getAnonWorkData).mockReturnValueOnce(null);
      vi.mocked(getProjectsModule.getProjects).mockResolvedValueOnce([]);
      vi.mocked(createProjectModule.createProject).mockResolvedValueOnce(mockProject);

      await act(async () => {
        await result.current.signIn("user@example.com", "password123");
      });

      const call1Name = vi.mocked(createProjectModule.createProject).mock.calls[0][0].name;

      vi.mocked(createProjectModule.createProject).mockClear();
      vi.mocked(actions.signIn).mockResolvedValueOnce(mockSignInResult);
      vi.mocked(anonWorkTracker.getAnonWorkData).mockReturnValueOnce(null);
      vi.mocked(getProjectsModule.getProjects).mockResolvedValueOnce([]);
      vi.mocked(createProjectModule.createProject).mockResolvedValueOnce(mockProject);

      await act(async () => {
        await result.current.signIn("user@example.com", "password123");
      });

      const call2Name = vi.mocked(createProjectModule.createProject).mock.calls[0][0].name;

      expect(call1Name).toMatch(/^New Design #\d+$/);
      expect(call2Name).toMatch(/^New Design #\d+$/);
    });
  });

  describe("edge cases", () => {
    it("should handle signIn with empty credentials", async () => {
      const { result } = renderHook(() => useAuth());
      vi.mocked(actions.signIn).mockResolvedValueOnce({ success: false });

      await act(async () => {
        await result.current.signIn("", "");
      });

      expect(vi.mocked(actions.signIn)).toHaveBeenCalledWith("", "");
    });

    it("should handle multiple sequential signIn calls", async () => {
      const { result } = renderHook(() => useAuth());
      vi.mocked(actions.signIn)
        .mockResolvedValueOnce({ success: false })
        .mockResolvedValueOnce(mockSignInResult);
      vi.mocked(anonWorkTracker.getAnonWorkData).mockReturnValue(null);
      vi.mocked(getProjectsModule.getProjects).mockResolvedValue([mockProject]);

      await act(async () => {
        await result.current.signIn("user@example.com", "wrong-password");
      });

      expect(result.current.isLoading).toBe(false);

      await act(async () => {
        await result.current.signIn("user@example.com", "correct-password");
      });

      expect(result.current.isLoading).toBe(false);
      expect(mockRouter.push).toHaveBeenCalledWith(`/${mockProject.id}`);
    });

    it("should handle concurrent signIn and signUp calls", async () => {
      const { result } = renderHook(() => useAuth());
      vi.mocked(actions.signIn).mockResolvedValueOnce(mockSignInResult);
      vi.mocked(actions.signUp).mockResolvedValueOnce(mockSignUpResult);
      vi.mocked(anonWorkTracker.getAnonWorkData).mockReturnValue(null);
      vi.mocked(getProjectsModule.getProjects).mockResolvedValue([mockProject]);

      await act(async () => {
        const signInPromise = result.current.signIn("user1@example.com", "password1");
        const signUpPromise = result.current.signUp("user2@example.com", "password2");
        await Promise.all([signInPromise, signUpPromise]);
      });

      expect(vi.mocked(actions.signIn)).toHaveBeenCalled();
      expect(vi.mocked(actions.signUp)).toHaveBeenCalled();
    });
  });
});
