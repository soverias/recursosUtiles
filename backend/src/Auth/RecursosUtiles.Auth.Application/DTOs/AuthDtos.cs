namespace RecursosUtiles.Auth.Application.DTOs;

public sealed record RegisterRequest(string Username, string Password);
public sealed record LoginRequest(string Username, string Password);
public sealed record AuthResponse(string Token, string Username);
