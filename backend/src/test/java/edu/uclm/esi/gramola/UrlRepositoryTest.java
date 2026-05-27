package edu.uclm.esi.gramola;

import edu.uclm.esi.gramola.repositories.UrlRepository;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
public class UrlRepositoryTest {

    @Autowired
    private UrlRepository urlRepository;

    @Test
    public void urlsAreLoadedAtStartup() {
        long count = urlRepository.count();
        Assertions.assertTrue(count > 0, "Expected at least one URL loaded at startup");
    }
}
