package com.yuri.piccolaarte;

import com.yuri.piccolaarte.entities.AppUser;
import com.yuri.piccolaarte.entities.UserRole;
import com.yuri.piccolaarte.repositories.AppUserRepository;
import com.yuri.piccolaarte.repositories.CategoryRepository;
import com.yuri.piccolaarte.repositories.ProductRepository;
import com.yuri.piccolaarte.services.AdminProductService;
import com.yuri.piccolaarte.services.ProductImageService;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.test.web.servlet.request.AbstractMockHttpServletRequestBuilder;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import jakarta.servlet.Filter;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/** Real controllers, security, JPA transactions and file storage; no production DB. */
@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:piccola_admin_review;MODE=PostgreSQL;DB_CLOSE_DELAY=-1",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa", "spring.datasource.password=",
        "spring.jpa.hibernate.ddl-auto=create-drop", "spring.jpa.show-sql=false",
        "spring.profiles.active=test", "app.admin.bootstrap.enabled=false",
        "app.cors.allowed-origins=https://piccolaarteatelier.com.br"
})
class AdminFlowsTests {
    private static final String PASSWORD = "Test-only-password-2026";
    private static final Path UPLOADS = temporaryDirectory();
    @Autowired WebApplicationContext context;
    @Autowired AppUserRepository users;
    @Autowired ProductRepository products;
    @Autowired CategoryRepository categories;
    @Autowired PasswordEncoder encoder;
    @Autowired JsonMapper json;
    @Autowired AdminProductService productService;
    @Autowired ProductImageService imageService;
    @Autowired PlatformTransactionManager transactions;
    private MockMvc mvc;

    private static Path temporaryDirectory() {
        try { return Files.createTempDirectory("piccola-admin-test-"); }
        catch (Exception e) { throw new IllegalStateException(e); }
    }

    @DynamicPropertySource
    static void storage(DynamicPropertyRegistry registry) {
        registry.add("app.storage.upload-dir", UPLOADS::toString);
    }

    @BeforeEach
    void setUp() throws Exception {
        mvc = MockMvcBuilders.webAppContextSetup(context)
                .addFilters(context.getBean("springSecurityFilterChain", Filter.class)).build();
        products.deleteAll();
        categories.deleteAll();
        users.deleteAll();
        try (var files = Files.list(UPLOADS)) {
            for (Path file : files.toList()) Files.delete(file);
        }
        users.saveAndFlush(new AppUser("admin@example.test", encoder.encode(PASSWORD), UserRole.ADMIN));
        users.saveAndFlush(new AppUser("user@example.test", encoder.encode(PASSWORD), UserRole.USER));
    }

    @AfterAll
    static void cleanUploads() throws Exception {
        try (var files = Files.list(UPLOADS)) {
            for (Path file : files.toList()) Files.delete(file);
        }
        Files.delete(UPLOADS);
    }

    @Test
    void anonymousReadsAndWritesCannotAccessAdministration() throws Exception {
        Client guest = new Client();
        for (String path : List.of("/api/admin/products", "/api/admin/categories", "/api/admin/products/1/images", "/api/auth/me")) {
            mvc.perform(get(path)).andExpect(status().isUnauthorized());
        }
        guest.mutate(post("/api/admin/products").contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isUnauthorized());
        guest.mutate(put("/api/admin/products/1").contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isUnauthorized());
        guest.mutate(delete("/api/admin/products/1")).andExpect(status().isUnauthorized());
        guest.mutate(post("/api/admin/products/1/images/upload")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/products")).andExpect(status().isOk());
    }

    @Test
    void loginRejectsWrongPasswordAndNormalUserCannotAdminister() throws Exception {
        Client client = new Client();
        client.mutate(post("/api/auth/login").param("email", "admin@example.test").param("password", "incorrect"))
                .andExpect(status().isUnauthorized());
        client.login("user@example.test");
        mvc.perform(get("/api/admin/products").session(client.session)).andExpect(status().isForbidden());
        client.mutate(delete("/api/admin/products/1")).andExpect(status().isForbidden());
    }

    @Test
    void csrfIsRequiredAndLoginRotatesTheSession() throws Exception {
        Client client = new Client();
        client.csrf();
        String before = client.session.getId();
        mvc.perform(post("/api/auth/login").session(client.session).param("email", "admin@example.test").param("password", PASSWORD))
                .andExpect(status().isForbidden());
        client.login("admin@example.test");
        assertNotEquals(before, client.session.getId());
        mvc.perform(delete("/api/admin/products/1").session(client.session)).andExpect(status().isForbidden());
    }

    @Test
    void logoutInvalidatesSessionAndOldCsrfToken() throws Exception {
        Client client = admin();
        JsonNode old = client.csrf();
        MockHttpSession session = client.session;
        client.mutate(post("/api/auth/logout")).andExpect(status().isNoContent());
        assertTrue(session.isInvalid());
        mvc.perform(get("/api/auth/me")).andExpect(status().isUnauthorized());
        mvc.perform(delete("/api/admin/products/1").header(old.get("headerName").asText(), old.get("token").asText()))
                .andExpect(status().isForbidden());
    }

    @Test
    void foreignOriginCannotUseAuthenticatedApi() throws Exception {
        Client client = admin();
        client.mutate(post("/api/admin/categories").header("Origin", "https://untrusted.example")
                .contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void createEditHideReactivateAndDeleteProduct() throws Exception {
        Client client = admin();
        long category = category(client);
        JsonNode created = product(client, category, "primeiro-produto");
        long id = created.get("id").asLong();
        mvc.perform(get("/api/products/primeiro-produto")).andExpect(status().isOk());
        client.mutate(put("/api/admin/products/" + id).contentType(MediaType.APPLICATION_JSON)
                .content(productBody(category, "produto-editado", false, false)))
                .andExpect(status().isOk());
        mvc.perform(get("/api/products/primeiro-produto")).andExpect(status().isNotFound());
        mvc.perform(get("/api/products/produto-editado")).andExpect(status().isNotFound());
        client.mutate(put("/api/admin/products/" + id).contentType(MediaType.APPLICATION_JSON)
                .content(productBody(category, "produto-editado", true, false)))
                .andExpect(status().isOk());
        JsonNode publicProduct = read(mvc.perform(get("/api/products/produto-editado"))
                .andExpect(status().isOk()).andReturn());
        assertTrue(publicProduct.get("price").isNull());
        client.mutate(delete("/api/admin/products/" + id)).andExpect(status().isNoContent());
        mvc.perform(get("/api/products/produto-editado")).andExpect(status().isNotFound());
    }

    @Test
    void rejectsDuplicateSlugsInvalidCategoryAndVisiblePriceWithoutValue() throws Exception {
        Client client = admin();
        long category = category(client);
        product(client, category, "duplicado");
        client.mutate(post("/api/admin/products").contentType(MediaType.APPLICATION_JSON)
                .content(productBody(category, "duplicado", true, true))).andExpect(status().isConflict());
        client.mutate(post("/api/admin/products").contentType(MediaType.APPLICATION_JSON)
                .content(productBody(999999L, "categoria-inexistente", true, true))).andExpect(status().isBadRequest());
        client.mutate(post("/api/admin/products").contentType(MediaType.APPLICATION_JSON)
                .content(productBody(category, "sem-preco", true, true).replace("12.50", "null")))
                .andExpect(status().isBadRequest());
    }

    @Test
    void linkedCategoryCannotBeDeletedButCanBeDeactivated() throws Exception {
        Client client = admin();
        long category = category(client);
        product(client, category, "com-categoria");
        client.mutate(delete("/api/admin/categories/" + category)).andExpect(status().isConflict());
        client.mutate(put("/api/admin/categories/" + category).contentType(MediaType.APPLICATION_JSON)
                .content(categoryBody(false))).andExpect(status().isOk());
        mvc.perform(get("/api/categories")).andExpect(content().json("[]"));
        mvc.perform(get("/api/products/com-categoria")).andExpect(status().isOk());
    }

    @Test
    void uploadReorderSelectCoverAndDeleteCoverKeepsValidGallery() throws Exception {
        Client client = admin();
        long product = product(client, category(client), "galeria").get("id").asLong();
        JsonNode first = upload(client, product);
        JsonNode second = upload(client, product);
        mvc.perform(get(first.get("url").asText())).andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.IMAGE_PNG));
        assertTrue(first.get("mainImage").asBoolean());
        assertFalse(second.get("mainImage").asBoolean());
        client.mutate(put(imagePath(product) + "/order").contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(Map.of("imageIds", List.of(second.get("id").asLong(), first.get("id").asLong())))))
                .andExpect(status().isOk());
        client.mutate(put(imagePath(product) + "/" + second.get("id").asLong()).contentType(MediaType.APPLICATION_JSON)
                .content(imageBody(second.get("url").asText(), true, 0))).andExpect(status().isOk());
        client.mutate(delete(imagePath(product) + "/" + second.get("id").asLong())).andExpect(status().isNoContent());
        JsonNode remaining = read(mvc.perform(get(imagePath(product)).session(client.session)).andReturn());
        assertEquals(1, remaining.size());
        assertTrue(remaining.get(0).get("mainImage").asBoolean());
        assertEquals(0, remaining.get(0).get("displayOrder").asInt());
        assertFalse(Files.exists(stored(second)));
        assertTrue(Files.exists(stored(first)));
    }

    @Test
    void deletingProductDeletesItsUploadedFilesAfterCommit() throws Exception {
        Client client = admin();
        long product = product(client, category(client), "excluir-imagens").get("id").asLong();
        JsonNode image = upload(client, product);
        assertTrue(Files.exists(stored(image)));
        client.mutate(delete("/api/admin/products/" + product)).andExpect(status().isNoContent());
        assertFalse(Files.exists(stored(image)));
    }

    @Test
    void wrongProductCannotEditOrDeleteAnotherProductsImage() throws Exception {
        Client client = admin();
        long category = category(client);
        long first = product(client, category, "dono").get("id").asLong();
        long second = product(client, category, "outro").get("id").asLong();
        JsonNode image = upload(client, first);
        client.mutate(delete(imagePath(second) + "/" + image.get("id").asLong())).andExpect(status().isNotFound());
        client.mutate(put(imagePath(second) + "/" + image.get("id").asLong()).contentType(MediaType.APPLICATION_JSON)
                .content(imageBody(image.get("url").asText(), true, 0))).andExpect(status().isNotFound());
        assertTrue(Files.exists(stored(image)));
    }

    @Test
    void invalidUploadAndInvalidReorderDoNotCorruptTheGallery() throws Exception {
        Client client = admin();
        long product = product(client, category(client), "validacoes").get("id").asLong();
        JsonNode image = upload(client, product);
        client.mutate(multipart(imagePath(product) + "/upload").file(new MockMultipartFile("file", "fake.jpg", "image/jpeg", "not an image".getBytes())))
                .andExpect(status().isBadRequest());
        client.mutate(put(imagePath(product) + "/order").contentType(MediaType.APPLICATION_JSON)
                .content("{\"imageIds\":[]}")).andExpect(status().isBadRequest());
        client.mutate(put(imagePath(product) + "/" + image.get("id").asLong()).contentType(MediaType.APPLICATION_JSON)
                .content(imageBody("/images/../secret", true, 0))).andExpect(status().isBadRequest());
        JsonNode images = read(mvc.perform(get(imagePath(product)).session(client.session)).andReturn());
        assertEquals(1, images.size());
        assertTrue(Files.exists(stored(image)));
    }

    @Test
    void twentyImageLimitAppliesToUrlCreationAndUpload() throws Exception {
        Client client = admin();
        long product = product(client, category(client), "limite").get("id").asLong();
        for (int i = 0; i < 20; i++) {
            client.mutate(post(imagePath(product)).contentType(MediaType.APPLICATION_JSON)
                    .content(imageBody("https://example.test/image-" + i + ".jpg", i == 0, i)))
                    .andExpect(status().isCreated());
        }
        client.mutate(post(imagePath(product)).contentType(MediaType.APPLICATION_JSON)
                .content(imageBody("https://example.test/extra.jpg", false, 20))).andExpect(status().isBadRequest());
        client.mutate(multipart(imagePath(product) + "/upload").file(png())).andExpect(status().isBadRequest());
    }

    @Test
    void rolledBackUploadRemovesOnlyTheNewFile() throws Exception {
        Client client = admin();
        long product = product(client, category(client), "upload-rollback").get("id").asLong();
        MockMultipartFile file = png();
        Path[] saved = new Path[1];
        new TransactionTemplate(transactions).executeWithoutResult(status -> {
            var image = imageService.upload(product, file, "Teste rollback");
            saved[0] = UPLOADS.resolve(Path.of(image.url()).getFileName());
            assertTrue(Files.exists(saved[0]));
            status.setRollbackOnly();
        });
        assertFalse(Files.exists(saved[0]));
        JsonNode images = read(mvc.perform(get(imagePath(product)).session(client.session)).andReturn());
        assertEquals(0, images.size());
    }

    @Test
    void rolledBackProductDeletionKeepsItsImagesAndPublicPage() throws Exception {
        Client client = admin();
        long product = product(client, category(client), "delete-rollback").get("id").asLong();
        JsonNode image = upload(client, product);
        new TransactionTemplate(transactions).executeWithoutResult(status -> {
            productService.delete(product);
            assertTrue(Files.exists(stored(image)));
            status.setRollbackOnly();
        });
        assertTrue(Files.exists(stored(image)));
        mvc.perform(get("/api/products/delete-rollback")).andExpect(status().isOk());
    }

    @Test
    void sharedFileIsDeletedOnlyWhenNoProductReferencesIt() throws Exception {
        Client client = admin();
        long category = category(client);
        long first = product(client, category, "primeira-referencia").get("id").asLong();
        long second = product(client, category, "segunda-referencia").get("id").asLong();
        JsonNode image = upload(client, first);
        JsonNode shared = read(client.mutate(post(imagePath(second)).contentType(MediaType.APPLICATION_JSON)
                .content(imageBody(image.get("url").asText(), true, 0))).andExpect(status().isCreated()).andReturn());
        client.mutate(delete(imagePath(first) + "/" + image.get("id").asLong())).andExpect(status().isNoContent());
        assertTrue(Files.exists(stored(image)));
        client.mutate(delete(imagePath(second) + "/" + shared.get("id").asLong())).andExpect(status().isNoContent());
        assertFalse(Files.exists(stored(image)));
    }

    private Client admin() throws Exception { Client client = new Client(); client.login("admin@example.test"); return client; }
    private long category(Client client) throws Exception {
        return read(client.mutate(post("/api/admin/categories").contentType(MediaType.APPLICATION_JSON).content(categoryBody(true)))
                .andExpect(status().isCreated()).andReturn()).get("id").asLong();
    }
    private String categoryBody(boolean active) throws Exception {
        return json.writeValueAsString(Map.of("name", "Teste", "slug", "categoria-teste", "description", "", "active", active, "displayOrder", 0));
    }
    private JsonNode product(Client client, long category, String slug) throws Exception {
        return read(client.mutate(post("/api/admin/products").contentType(MediaType.APPLICATION_JSON).content(productBody(category, slug, true, true)))
                .andExpect(status().isCreated()).andReturn());
    }
    private String productBody(long category, String slug, boolean active, boolean visible) {
        return "{\"name\":\"Produto de teste\",\"slug\":\"" + slug + "\",\"price\":12.50,\"priceVisible\":" + visible
                + ",\"featured\":false,\"active\":" + active + ",\"available\":true,\"madeToOrder\":false,\"categoryIds\":[" + category + "]}";
    }
    private String imagePath(long id) { return "/api/admin/products/" + id + "/images"; }
    private String imageBody(String url, boolean main, int order) throws Exception {
        return json.writeValueAsString(Map.of("url", url, "altText", "Foto de teste", "mainImage", main, "displayOrder", order));
    }
    private JsonNode upload(Client client, long id) throws Exception {
        return read(client.mutate(multipart(imagePath(id) + "/upload").file(png())).andExpect(status().isCreated()).andReturn());
    }
    private MockMultipartFile png() throws Exception {
        ByteArrayOutputStream bytes = new ByteArrayOutputStream();
        ImageIO.write(new BufferedImage(8, 8, BufferedImage.TYPE_INT_RGB), "png", bytes);
        return new MockMultipartFile("file", "test.png", "image/png", bytes.toByteArray());
    }
    private Path stored(JsonNode image) { return UPLOADS.resolve(Path.of(image.get("url").asText()).getFileName()); }
    private JsonNode read(MvcResult result) throws Exception { return json.readTree(result.getResponse().getContentAsString()); }
    private class Client {
        MockHttpSession session;
        JsonNode csrf() throws Exception {
            MockHttpServletRequestBuilder request = get("/api/auth/csrf");
            if (session != null) request.session(session);
            MvcResult result = mvc.perform(request).andExpect(status().isOk()).andReturn();
            session = (MockHttpSession) result.getRequest().getSession(false);
            return read(result);
        }
        org.springframework.test.web.servlet.ResultActions mutate(AbstractMockHttpServletRequestBuilder<?> request) throws Exception {
            JsonNode token = csrf();
            return mvc.perform(request.session(session).header(token.get("headerName").asText(), token.get("token").asText()));
        }
        void login(String email) throws Exception {
            mutate(post("/api/auth/login").param("email", email).param("password", PASSWORD)).andExpect(status().isNoContent());
        }
    }
}
