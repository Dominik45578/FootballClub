package com.polibuda.footballclub.gateway.filters;


import com.polibuda.footballclub.common.claims.MutationHeaderClaims;
import com.polibuda.footballclub.gateway.model.ClaimExtractor;
import com.polibuda.footballclub.gateway.model.UserContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;


@Component
public class ClaimsRelayGlobalFilter implements GlobalFilter, Ordered {


    private static final Logger log = LoggerFactory.getLogger(ClaimsRelayGlobalFilter.class);
    private final ClaimExtractor extractor;


    public ClaimsRelayGlobalFilter(ClaimExtractor extractor) {
        this.extractor = extractor;
    }


    @Override
    public int getOrder() {
// after authentication, before routing
        return Ordered.LOWEST_PRECEDENCE - 50;
    }


    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        return exchange.getPrincipal()
                .cast(Authentication.class)
                .filter(auth -> auth instanceof JwtAuthenticationToken)
                .cast(JwtAuthenticationToken.class)
                .flatMap(token -> {
                    var jwt = token.getToken();
                    UserContext ctx = extractor.extract(jwt);


                    ServerHttpRequest mutated = exchange.getRequest().mutate()
                            .header(MutationHeaderClaims.X_EMAIL, safe(ctx.username()))
                            .header(MutationHeaderClaims.X_ROLES, join(ctx.roles()))
                            .header(MutationHeaderClaims.X_SCOPE, join(ctx.scopes()))
                            .header(MutationHeaderClaims.X_ACTIVATED, safe(String.valueOf(ctx.activated())))
                            .header(MutationHeaderClaims.X_BLOCKED, safe(String.valueOf(ctx.blocked())))
                            .build();


                    if (log.isDebugEnabled()) {
                        log.debug("Relaying user {} roles={} scopes={}", ctx.username(), ctx.roles(), ctx.scopes());
                    }


                    return chain.filter(exchange.mutate().request(mutated).build());
                })
                .switchIfEmpty(chain.filter(exchange));
    }


    private static String safe(String s) {
        return s == null ? "" : s;
    }

    private static String join(java.util.Set<String> set) {
        return set == null ? "" : String.join(",", set);
    }
}