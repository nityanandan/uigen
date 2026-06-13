import { test, expect, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/headers");
vi.mock("jose");

import { createSession } from "../auth";
import { cookies } from "next/headers";
import { SignJWT } from "jose";

test("createSession creates and sets a JWT token in cookies", async () => {
  const mockUserId = "user-123";
  const mockEmail = "test@example.com";
  const mockToken = "mock.jwt.token";

  const mockCookieStore = {
    set: vi.fn(),
  };
  vi.mocked(cookies).mockResolvedValue(mockCookieStore as any);

  const mockSignJWT = {
    setProtectedHeader: vi.fn().mockReturnThis(),
    setExpirationTime: vi.fn().mockReturnThis(),
    setIssuedAt: vi.fn().mockReturnThis(),
    sign: vi.fn().mockResolvedValue(mockToken),
  };
  vi.mocked(SignJWT).mockImplementation(() => mockSignJWT as any);

  await createSession(mockUserId, mockEmail);

  expect(SignJWT).toHaveBeenCalledWith(
    expect.objectContaining({
      userId: mockUserId,
      email: mockEmail,
    })
  );
  expect(mockSignJWT.setProtectedHeader).toHaveBeenCalledWith({ alg: "HS256" });
  expect(mockSignJWT.setExpirationTime).toHaveBeenCalledWith("7d");
  expect(mockSignJWT.setIssuedAt).toHaveBeenCalled();
  expect(mockSignJWT.sign).toHaveBeenCalled();
  expect(mockCookieStore.set).toHaveBeenCalledWith(
    "auth-token",
    mockToken,
    expect.objectContaining({
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    })
  );
});

test("createSession sets secure cookie flag in production", async () => {
  const originalNodeEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = "production";

  const mockUserId = "user-123";
  const mockEmail = "test@example.com";
  const mockToken = "mock.jwt.token";

  const mockCookieStore = {
    set: vi.fn(),
  };
  vi.mocked(cookies).mockResolvedValue(mockCookieStore as any);

  const mockSignJWT = {
    setProtectedHeader: vi.fn().mockReturnThis(),
    setExpirationTime: vi.fn().mockReturnThis(),
    setIssuedAt: vi.fn().mockReturnThis(),
    sign: vi.fn().mockResolvedValue(mockToken),
  };
  vi.mocked(SignJWT).mockImplementation(() => mockSignJWT as any);

  await createSession(mockUserId, mockEmail);

  expect(mockCookieStore.set).toHaveBeenCalledWith(
    "auth-token",
    mockToken,
    expect.objectContaining({
      secure: true,
    })
  );

  process.env.NODE_ENV = originalNodeEnv;
});
