package br.com.group18.energiai.infrastructure.adapters.in.web.security;

import jakarta.servlet.http.HttpServletRequest;

public final class SessionUserResolver {

    public static final String USER_ID_ATTRIBUTE = "auth.userId";

    private SessionUserResolver() {}

    public static Long userId(HttpServletRequest request) {
        Object attribute = request.getAttribute(USER_ID_ATTRIBUTE);
        return attribute instanceof Long userId ? userId : null;
    }
}
