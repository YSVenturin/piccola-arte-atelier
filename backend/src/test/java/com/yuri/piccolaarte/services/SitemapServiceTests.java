package com.yuri.piccolaarte.services;

import com.yuri.piccolaarte.entities.Product;
import com.yuri.piccolaarte.repositories.ProductRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.w3c.dom.Document;
import org.w3c.dom.NodeList;
import org.xml.sax.InputSource;

import javax.xml.parsers.DocumentBuilderFactory;
import java.io.StringReader;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class SitemapServiceTests {

    private ProductRepository repository;
    private SitemapService service;

    @BeforeEach
    void setUp() {
        repository = mock(ProductRepository.class);
        service = new SitemapService(repository);
    }

    @Test
    void emptyCatalogStillHasPublicPagesAndNoAdministrativeUrls() throws Exception {
        when(repository.findByActiveTrueOrderByCreatedAtDesc()).thenReturn(List.of());
        Document document = parse(service.generate());
        assertEquals("http://www.sitemaps.org/schemas/sitemap/0.9", document.getDocumentElement().getNamespaceURI());
        assertEquals(List.of(
                "https://piccolaarteatelier.com.br/",
                "https://piccolaarteatelier.com.br/produtos",
                "https://piccolaarteatelier.com.br/sobre",
                "https://piccolaarteatelier.com.br/contato",
                "https://piccolaarteatelier.com.br/privacidade.html"
        ), urls(document));
        assertEquals(0, document.getElementsByTagNameNS("*", "lastmod").getLength());
    }

    @Test
    void usesCurrentPublicProductsIncludingUnavailableActiveProducts() throws Exception {
        Product available = product("bandeja");
        Product unavailable = product("anel");
        unavailable.setAvailable(false);
        unavailable.setMadeToOrder(false);
        when(repository.findByActiveTrueOrderByCreatedAtDesc())
                .thenReturn(List.of(available, unavailable))
                .thenReturn(List.of(product("produto-novo")));

        List<String> first = urls(parse(service.generate()));
        assertTrue(first.contains("https://piccolaarteatelier.com.br/produtos/anel"));
        assertTrue(first.contains("https://piccolaarteatelier.com.br/produtos/bandeja"));
        List<String> next = urls(parse(service.generate()));
        assertTrue(next.contains("https://piccolaarteatelier.com.br/produtos/produto-novo"));
        assertFalse(next.contains("https://piccolaarteatelier.com.br/produtos/anel"));
        verify(repository, times(2)).findByActiveTrueOrderByCreatedAtDesc();
    }

    @Test
    void escapesXmlAndEncodesProductPathSegments() throws Exception {
        when(repository.findByActiveTrueOrderByCreatedAtDesc()).thenReturn(List.of(product("peça & teste")));
        String xml = service.generate();
        assertTrue(xml.contains("&amp;"));
        assertTrue(urls(parse(xml)).contains("https://piccolaarteatelier.com.br/produtos/pe%C3%A7a%20&%20teste"));
    }

    private static Product product(String slug) {
        Product product = new Product();
        product.setSlug(slug);
        return product;
    }

    private static Document parse(String xml) throws Exception {
        DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
        factory.setNamespaceAware(true);
        factory.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true);
        return factory.newDocumentBuilder().parse(new InputSource(new StringReader(xml)));
    }

    private static List<String> urls(Document document) {
        NodeList nodes = document.getElementsByTagNameNS("*", "loc");
        List<String> result = new ArrayList<>();
        for (int i = 0; i < nodes.getLength(); i++) {
            result.add(nodes.item(i).getTextContent());
        }
        return result;
    }
}
