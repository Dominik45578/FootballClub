package com.polibuda.footballclub.football_external_data.config;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@Data
@Validated
@ConfigurationProperties(prefix = "api.football")
public class FedProperties {

    @NotBlank
    private String apiUrl;

    @NotBlank
    private String apiKey;

    @Valid
    private Auth auth = new Auth();

    @Valid
    private Squads squads = new Squads();

    @Valid
    private Teams teams = new Teams();

    @Data
    public static class Auth {
        @NotBlank
        private String header;
    }

    @Data
    public static class Squads {
        @NotBlank
        private String url;
    }

    @Data
    public static class Teams {
        @NotBlank
        private String url;
    }
    @Data
    public static class Params {
        @NotBlank
        private String id;

        @NotBlank
        private String team;
    }
}