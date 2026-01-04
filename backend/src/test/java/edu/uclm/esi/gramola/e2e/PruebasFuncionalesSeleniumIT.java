package edu.uclm.esi.gramola.e2e;

import edu.uclm.esi.gramola.dao.BarSettingsRepository;
import edu.uclm.esi.gramola.dao.QueueItemRepository;
import edu.uclm.esi.gramola.dao.UserRepository;
import edu.uclm.esi.gramola.entities.BarSettings;
import edu.uclm.esi.gramola.entities.User;
import io.github.bonigarcia.wdm.WebDriverManager;
import org.awaitility.Awaitility;
import org.junit.jupiter.api.*;
import org.openqa.selenium.*;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.awt.GraphicsEnvironment;
import java.time.Duration;
import java.util.List;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Pruebas funcionales (E2E) con Selenium.
 *
 * Escenarios (según enunciado):
 * 1) Un cliente busca una canción, paga y la pone. Se comprueba pago confirmado (BD) y canción en cola (backend).
 * 2) Un cliente pone mal los datos de pago y se produce un error.
 *
 * NOTA IMPORTANTE (prerrequisitos):
 * - El frontend debe estar levantado en https://localhost:4200
 * - El backend debe estar levantado (vía proxy del frontend) y apuntando a la misma BD que este test.
 * - Para que /queue no redirija a Spotify, el usuario del test debe tener token de Spotify válido en BD.
 *   (Puedes hacer el OAuth una vez manualmente con ese usuario antes de ejecutar Selenium).
 *
 * Ejecución:
 * - mvn -Pe2e -DskipTests=false verify
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class PruebasFuncionalesSeleniumIT {

    // El dev-server de Angular está configurado con SSL (ver gramolafe/angular.json)
    private static final String FRONTEND = System.getProperty("e2e.frontend", "https://localhost:4200");
    private static final Duration WAIT = Duration.ofSeconds(20);

    @Autowired
    UserRepository users;

    @Autowired
    BarSettingsRepository settingsRepo;

    @Autowired
    QueueItemRepository queueRepo;

    private WebDriver driver;
    private WebDriverWait wait;

    private String email;
    private String password;

    @BeforeEach
    void setup() {
        WebDriverManager.chromedriver().setup();

        ChromeOptions options = new ChromeOptions();
        options.setAcceptInsecureCerts(true);
        options.addArguments("--ignore-certificate-errors");
        options.addArguments("--allow-insecure-localhost");
        options.addArguments("--remote-allow-origins=*");

        // En entornos headless (p.ej. ejecución desde Maven/surefire), forzar headless explícito mejora estabilidad.
        if (GraphicsEnvironment.isHeadless()) {
            options.addArguments("--headless=new");
            options.addArguments("--window-size=1920,1080");
        }

        driver = new ChromeDriver(options);
        wait = new WebDriverWait(driver, WAIT);

        // Usuario único por ejecución para evitar colisiones
        long ts = System.currentTimeMillis();
        email = "e2e_" + ts + "@test.local";
        password = "Password123!";

        prepareUserInDb(email, password);
    }

    @AfterEach
    void teardown() {
        try {
            if (driver != null) driver.quit();
        } catch (Exception ignored) {
        }
    }

    @Test
    @Order(1)
    void escenario1_buscar_pagar_y_poner_cancion() {
        // 1) Login
        login(email, password);

        // 2) Recargar monedas (pago OK)
        int coinsBefore = users.findByEmailIgnoreCase(email).orElseThrow().getCoins();
        buyCoinsPackOnPlansPage(5, StripeCard.SUCCESS);

        // Verificar en BD que el pago (recarga) se confirmó (monedas aumentan)
        Awaitility.await().atMost(20, TimeUnit.SECONDS).untilAsserted(() -> {
            int now = users.findByEmailIgnoreCase(email).orElseThrow().getCoins();
            assertEquals(coinsBefore + 5, now);
        });

        // 3) Ir a la cola, buscar una canción y añadirla
        //    (Si te redirige a Spotify, este test fallará: necesitas token válido para el usuario.)
        long queueBefore = queueRepo.findAllByUser_IdOrderByCreatedAtAsc(users.findByEmailIgnoreCase(email).orElseThrow().getId()).size();
        addFirstSearchResultToQueue("Imagine");

        // Verificar en BD que la canción se añadió a la cola del usuario
        Awaitility.await().atMost(20, TimeUnit.SECONDS).untilAsserted(() -> {
            long after = queueRepo.findAllByUser_IdOrderByCreatedAtAsc(users.findByEmailIgnoreCase(email).orElseThrow().getId()).size();
            assertTrue(after > queueBefore);
        });
    }

    @Test
    @Order(2)
    void escenario2_pago_con_datos_malos_muestra_error_y_no_cambia_bd() {
        login(email, password);

        int coinsBefore = users.findByEmailIgnoreCase(email).orElseThrow().getCoins();

        // Intentar recarga con tarjeta rechazada
        driver.navigate().to(FRONTEND + "/plans");
        clickPack(5);
        wait.until(ExpectedConditions.visibilityOfElementLocated(By.cssSelector("#card-element")));

        fillStripeCard(StripeCard.DECLINED);
        clickPayOnPlans();

        // Debe aparecer un error (Stripe suele devolver texto en inglés)
        WebElement err = wait.until(ExpectedConditions.visibilityOfElementLocated(By.cssSelector("p.error")));
        assertTrue(err.getText() != null && !err.getText().trim().isEmpty());

        // No debe cambiar el saldo en BD
        Awaitility.await().atMost(10, TimeUnit.SECONDS).untilAsserted(() -> {
            int now = users.findByEmailIgnoreCase(email).orElseThrow().getCoins();
            assertEquals(coinsBefore, now);
        });
    }

    // ---------------- Helpers UI ----------------

    private void login(String identifier, String pwd) {
        driver.navigate().to(FRONTEND + "/login");

        // Marcar modo E2E en el frontend para evitar redirecciones a OAuth de Spotify.
        try {
            ((JavascriptExecutor) driver).executeScript("localStorage.setItem('e2e:disableSpotify','1');");
        } catch (Exception ignored) {
        }

        WebElement emailInput = wait.until(ExpectedConditions.visibilityOfElementLocated(By.cssSelector("input[name='email']")));
        WebElement pwdInput = driver.findElement(By.cssSelector("input[name='pwd']"));

        emailInput.clear();
        emailInput.sendKeys(identifier);
        pwdInput.clear();
        pwdInput.sendKeys(pwd);

        // Submit
        pwdInput.submit();

        // Tras login, la app suele navegar a /queue
        wait.until(d -> d.getCurrentUrl().contains("/queue") || d.getCurrentUrl().contains("/plans"));
    }

    private void buyCoinsPackOnPlansPage(int pack, StripeCard card) {
        driver.navigate().to(FRONTEND + "/plans");
        clickPack(pack);
        wait.until(ExpectedConditions.visibilityOfElementLocated(By.cssSelector("#card-element")));

        fillStripeCard(card);
        clickPayOnPlans();

        // Esperar mensaje OK
        WebElement ok = wait.until(ExpectedConditions.visibilityOfElementLocated(By.cssSelector("p.ok")));
        assertTrue(ok.getText().contains("Recarga completada"));
    }

    private void clickPack(int pack) {
        List<WebElement> packs = wait.until(ExpectedConditions.presenceOfAllElementsLocatedBy(By.cssSelector("button.pack")));
        WebElement target = packs.stream()
                .filter(b -> b.getText() != null && b.getText().contains("+" + pack))
                .findFirst()
                .orElseThrow(() -> new AssertionError("No se encontró el pack +" + pack + " en /plans"));
        target.click();
    }

    private void clickPayOnPlans() {
        WebElement payBtn = wait.until(ExpectedConditions.elementToBeClickable(By.cssSelector("div.stripe button.btn")));
        payBtn.click();
    }

    private void addFirstSearchResultToQueue(String query) {
        driver.navigate().to(FRONTEND + "/queue");

        // Si falta token Spotify, la app redirige fuera. Detectarlo pronto para que el fallo sea claro.
        Awaitility.await().atMost(5, TimeUnit.SECONDS).untilAsserted(() -> {
            String url = driver.getCurrentUrl();
            assertTrue(url.contains("/queue"), "La app no está en /queue (posible redirección Spotify): " + url);
        });

        WebElement q = wait.until(ExpectedConditions.visibilityOfElementLocated(By.cssSelector("input[name='q']")));
        q.clear();
        q.sendKeys(query);
        q.submit();

        // Esperar resultados y pulsar "Añadir a cola" en el primer resultado disponible.
        wait.until(ExpectedConditions.presenceOfElementLocated(By.cssSelector(".results ul li")));
        List<WebElement> addButtons = wait.until(ExpectedConditions.presenceOfAllElementsLocatedBy(
                By.cssSelector(".results ul li button.btn.outline")
        ));
        WebElement firstEnabledAdd = addButtons.stream()
                .filter(WebElement::isDisplayed)
                .filter(WebElement::isEnabled)
                .findFirst()
                .orElseThrow(() -> new AssertionError("No hay botón 'Añadir a cola' habilitado en los resultados"));
        // Click robusto (a veces Chrome no dispara el click si el elemento queda fuera de viewport)
        try {
            ((JavascriptExecutor) driver).executeScript("arguments[0].scrollIntoView({block: 'center'});", firstEnabledAdd);
        } catch (Exception ignored) {
        }
        try {
            wait.until(ExpectedConditions.elementToBeClickable(firstEnabledAdd)).click();
        } catch (ElementClickInterceptedException | TimeoutException e) {
            try {
                ((JavascriptExecutor) driver).executeScript("arguments[0].click();", firstEnabledAdd);
            } catch (Exception ex) {
                throw e;
            }
        }

        // Confirmación (solo aparece si el precio estimado ya está disponible cuando se pulsa "Añadir").
        try {
            WebDriverWait shortWait = new WebDriverWait(driver, Duration.ofSeconds(10));
            WebElement confirmBtn = shortWait.until(ExpectedConditions.elementToBeClickable(
                    By.cssSelector(".results ul li .confirm-actions button.btn")
            ));
            confirmBtn.click();
        } catch (TimeoutException ignored) {
            // No hay confirmación: el frontend añadió directamente.
        }

        // No esperamos a que la UI se refresque aquí: en este proyecto es más estable comprobar el efecto
        // por BD (ver Awaitility en el test), que es además lo que pide el enunciado.
    }

    // ---------------- Helpers BD ----------------

    private void prepareUserInDb(String email, String rawPassword) {
        // Crear usuario verificado para poder loguear.
        // El backend usa BCrypt, así que guardamos ya el hash.
        String bcrypt = new org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder().encode(rawPassword);

        User u = new User();
        u.setEmail(email);
        u.setPassword(bcrypt);
        u.setVerified(true);
        u.setCoins(0);
        u = users.save(u);

        // Ajustes del bar (opcional, pero mantiene la BD coherente)
        BarSettings s = new BarSettings();
        s.setUser(u);
        s.setBarName("Bar E2E");
        s.setPricePerSong(1);
        settingsRepo.save(s);
    }

    // ---------------- Stripe cards ----------------

    private enum StripeCard {
        SUCCESS("4242424242424242", "12/34", "123"),
        DECLINED("4000000000000002", "12/34", "123");

        final String number;
        final String exp;
        final String cvc;

        StripeCard(String number, String exp, String cvc) {
            this.number = number;
            this.exp = exp;
            this.cvc = cvc;
        }
    }

    private void fillStripeCard(StripeCard card) {
        // Stripe Elements está dentro de un iframe: hay que hacer switch.
        WebElement iframe = wait.until(ExpectedConditions.presenceOfElementLocated(By.cssSelector("#card-element iframe")));
        driver.switchTo().frame(iframe);
        try {
            // La mayoría de integraciones permiten estos inputs
            WebElement cardNumber = wait.until(ExpectedConditions.elementToBeClickable(By.cssSelector("input[name='cardnumber']")));
            cardNumber.sendKeys(card.number);

            WebElement exp = driver.findElement(By.cssSelector("input[name='exp-date']"));
            exp.sendKeys(card.exp);

            WebElement cvc = driver.findElement(By.cssSelector("input[name='cvc']"));
            cvc.sendKeys(card.cvc);
        } catch (NoSuchElementException ex) {
            // Fallback: un único input. Mandamos secuencia con TAB.
            WebElement any = wait.until(ExpectedConditions.elementToBeClickable(By.cssSelector("input")));
            any.sendKeys(card.number + Keys.TAB + card.exp + Keys.TAB + card.cvc);
        } finally {
            driver.switchTo().defaultContent();
        }
    }
}
