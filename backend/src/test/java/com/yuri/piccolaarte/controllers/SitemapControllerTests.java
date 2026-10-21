package com.yuri.piccolaarte.controllers;

import com.yuri.piccolaarte.config.SecurityConfig;
import com.yuri.piccolaarte.security.DatabaseUserDetailsService;
import com.yuri.piccolaarte.services.SitemapService;
import jakarta.servlet.Filter;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.MapPropertySource;
import org.springframework.mock.web.MockServletContext;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.support.AnnotationConfigWebApplicationContext;
import org.springframework.web.servlet.config.annotation.EnableWebMvc;
import tools.jackson.databind.json.JsonMapper;

import java.util.Map;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class SitemapControllerTests {

    private AnnotationConfigWebApplicationContext context;
    private MockMvc mvc;

    @BeforeEach
    void setUp() {
        context = new AnnotationConfigWebApplicationContext();
        context.setServletContext(new MockServletContext());
        context.getEnvironment().getPropertySources().addFirst(new MapPropertySource(
                "sitemap-test", Map.of("app.cors.allowed-origins", "http://localhost:5173")
        ));
        context.register(WebConfig.class, SecurityConfig.class);
        context.refresh();
        mvc = MockMvcBuilders.webAppContextSetup(context)
                .addFilters(context.getBean("springSecurityFilterChain", Filter.class))
                .build();
    }

    @AfterEach
    void tearDown() {
        if (context != null) context.close();
    }

    @Test
    void anonymousGetReturnsXmlWithoutOpeningAdministrativeApi() throws Exception {
        mvc.perform(get("/api/sitemap.xml"))
                .andExpect(status().isOk())
                .andExpect(content().contentType("application/xml;charset=UTF-8"))
                .andExpect(content().string("<?xml version=\"1.0\" encoding=\"UTF-8\"?><urlset/>"));
        mvc.perform(get("/api/admin/products")).andExpect(status().isUnauthorized());
    }

    @Test
    void anonymousHeadIsAllowed() throws Exception {
        mvc.perform(head("/api/sitemap.xml"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith("application/xml"));
    }

    @Test
    void writeRequestIsStillRejected() throws Exception {
        mvc.perform(post("/api/sitemap.xml")).andExpect(status().isForbidden());
    }

    @Configuration
    @EnableWebMvc
    static class WebConfig {
        @Bean
        SitemapService sitemapService() {
            SitemapService service = mock(SitemapService.class);
            when(service.generate()).thenReturn("<?xml version=\"1.0\" encoding=\"UTF-8\"?><urlset/>");
            return service;
        }

        @Bean
        SitemapController sitemapController(SitemapService service) {
            return new SitemapController(service);
        }

        @Bean
        DatabaseUserDetailsService userDetailsService() {
            return mock(DatabaseUserDetailsService.class);
        }

        @Bean
        JsonMapper jsonMapper() {
            return JsonMapper.builder().build();
        }
    }
}
