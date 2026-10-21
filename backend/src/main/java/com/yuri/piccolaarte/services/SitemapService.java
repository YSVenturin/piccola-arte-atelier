package com.yuri.piccolaarte.services;

import com.yuri.piccolaarte.entities.Product;
import com.yuri.piccolaarte.repositories.ProductRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.util.UriUtils;

import javax.xml.stream.XMLOutputFactory;
import javax.xml.stream.XMLStreamException;
import javax.xml.stream.XMLStreamWriter;
import java.io.StringWriter;
import java.nio.charset.StandardCharsets;
import java.util.List;

@Service
public class SitemapService {

    private static final String SITE_URL = "https://piccolaarteatelier.com.br";
    private static final String NAMESPACE = "http://www.sitemaps.org/schemas/sitemap/0.9";
    private static final List<String> PUBLIC_PATHS = List.of(
            "/", "/produtos", "/sobre", "/contato", "/privacidade.html"
    );

    private final ProductRepository productRepository;

    public SitemapService(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    @Transactional(readOnly = true)
    public String generate() {
        // A mesma seleção usada pelo catálogo: indisponíveis ainda podem estar ativos.
        List<String> productPaths = productRepository.findByActiveTrueOrderByCreatedAtDesc()
                .stream()
                .map(Product::getSlug)
                .sorted()
                .map(slug -> "/produtos/" + UriUtils.encodePathSegment(slug, StandardCharsets.UTF_8))
                .toList();

        try {
            StringWriter output = new StringWriter();
            XMLStreamWriter xml = XMLOutputFactory.newFactory().createXMLStreamWriter(output);
            xml.writeStartDocument("UTF-8", "1.0");
            xml.writeStartElement("urlset");
            xml.writeDefaultNamespace(NAMESPACE);

            for (String path : PUBLIC_PATHS) {
                writeUrl(xml, path);
            }
            for (String path : productPaths) {
                writeUrl(xml, path);
            }

            xml.writeEndElement();
            xml.writeEndDocument();
            xml.close();
            return output.toString();
        } catch (XMLStreamException exception) {
            throw new IllegalStateException("Could not generate sitemap XML.", exception);
        }
    }

    private static void writeUrl(XMLStreamWriter xml, String path) throws XMLStreamException {
        xml.writeStartElement("url");
        xml.writeStartElement("loc");
        xml.writeCharacters(SITE_URL + path);
        xml.writeEndElement();
        xml.writeEndElement();
    }
}
