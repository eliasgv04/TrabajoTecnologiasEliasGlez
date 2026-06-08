
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
 * Pruebas funcionales E2E (end-to-end) con Selenium WebDriver.
 *
 * Escenarios cubiertos:
 * 1) Flujo completo: un cliente del bar busca una canción, paga con tarjeta correcta y la añade a la cola.
 *    Se verifica en base de datos que el pago quedó confirmado y que la canción aparece en queue_items.
 * 2) Pago fallido: el cliente introduce datos de tarjeta rechazada. Se verifica que la UI muestra error
 *    y que el saldo de monedas en BD no cambia.
 *
 * Prerrequisitos para ejecutar:
 * - El frontend Angular debe estar levantado en https://localhost:4200
 * - El backend Spring Boot debe estar corriendo y apuntando a la misma BD que este test
 * - Para evitar la redirección OAuth de Spotify durante la ejecución automática, el test inyecta
 *   localStorage.setItem('e2e:disableSpotify','1') antes del login. El componente Angular lee esa
 *   clave y omite la conexión con Spotify.
 *
 * Ejecución:
 * - mvn -Pe2e -DskipTests=false verify
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class PruebasFuncionalesSeleniumIT {

    // URL base del frontend. Se puede sobreescribir con -De2e.frontend=https://... al ejecutar Maven.
    private static final String FRONTEND = System.getProperty("e2e.frontend", "https://localhost:4200");
    // Tiempo máximo de espera para que un elemento aparezca en pantalla o la BD se actualice.
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
        // WebDriverManager descarga automáticamente el chromedriver compatible con el Chrome instalado.
        WebDriverManager.chromedriver().setup();

        ChromeOptions options = new ChromeOptions();
        // Necesario porque el backend usa un certificado SSL autofirmado en localhost.
        options.setAcceptInsecureCerts(true);
        options.addArguments("--ignore-certificate-errors");
        options.addArguments("--allow-insecure-localhost");
        options.addArguments("--remote-allow-origins=*");

        // En CI o entornos sin pantalla se ejecuta en modo headless para no necesitar escritorio.
        if (GraphicsEnvironment.isHeadless()) {
            options.addArguments("--headless=new");
            options.addArguments("--window-size=1920,1080");
        }

        driver = new ChromeDriver(options);
        wait = new WebDriverWait(driver, WAIT);

        // Email único por ejecución (usando timestamp) para evitar colisiones si el test se lanza varias veces.
        long ts = System.currentTimeMillis();
        email = "e2e_" + ts + "@test.local";
        password = "Password123!";

        // Crear el usuario en BD directamente (sin pasar por el flujo de registro + verificación de email).
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
        // Paso 1: el usuario hace login en la app
        login(email, password);

        // Paso 2: recarga monedas con tarjeta correcta (Stripe test card 4242...)
        int coinsBefore = users.findByEmailIgnoreCase(email).orElseThrow().getCoins();
        buyCoinsPackOnPlansPage(5, StripeCard.SUCCESS);

        // Verificación en BD: las monedas del usuario deben haber aumentado en 5
        // Awaitility espera hasta 20s para dar tiempo al backend a procesar el pago
        Awaitility.await().atMost(20, TimeUnit.SECONDS).untilAsserted(() -> {
            int now = users.findByEmailIgnoreCase(email).orElseThrow().getCoins();
            assertEquals(coinsBefore + 5, now);
        });

        // Paso 3: navega a la gramola, busca "Imagine" y añade el primer resultado a la cola
        long queueBefore = queueRepo.findAllByUser_IdOrderByCreatedAtAsc(users.findByEmailIgnoreCase(email).orElseThrow().getId()).size();
        addFirstSearchResultToQueue("Imagine");

        // Verificación en BD: la tabla queue_items debe tener una fila más para este usuario
        Awaitility.await().atMost(20, TimeUnit.SECONDS).untilAsserted(() -> {
            long after = queueRepo.findAllByUser_IdOrderByCreatedAtAsc(users.findByEmailIgnoreCase(email).orElseThrow().getId()).size();
            assertTrue(after > queueBefore);
        });
    }

    @Test
    @Order(2)
    void escenario2_pago_con_datos_malos_muestra_error_y_no_cambia_bd() {
        login(email, password);

        // Guardar el saldo actual antes del intento de pago fallido
        int coinsBefore = users.findByEmailIgnoreCase(email).orElseThrow().getCoins();

        // Intentar una recarga con tarjeta rechazada (Stripe test card 4000000000000002)
        driver.navigate().to(FRONTEND + "/plans");
        clickPack(5);
        wait.until(ExpectedConditions.visibilityOfElementLocated(By.cssSelector("#card-element")));

        fillStripeCard(StripeCard.DECLINED);
        clickPayOnPlans();

        // La UI debe mostrar un mensaje de error devuelto por Stripe
        WebElement err = wait.until(ExpectedConditions.visibilityOfElementLocated(By.cssSelector("p.error")));
        assertTrue(err.getText() != null && !err.getText().trim().isEmpty());

        // Verificación en BD: el saldo de monedas no debe haber cambiado porque el pago no se completó
        Awaitility.await().atMost(10, TimeUnit.SECONDS).untilAsserted(() -> {
            int now = users.findByEmailIgnoreCase(email).orElseThrow().getCoins();
            assertEquals(coinsBefore, now);
        });
    }

    // ---------------- Helpers de UI ----------------

    private void login(String identifier, String pwd) {
        driver.navigate().to(FRONTEND + "/login");

        // Desactiva el flujo OAuth de Spotify para que el test no quede bloqueado en una redirección externa.
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

        // Confirmar que la app está en /queue y no redirigió a Spotify u otra ruta.
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

        // La verificación del efecto se hace por BD con Awaitility en el test que llama a este helper,
        // ya que es más fiable que esperar a que la UI refresque la lista de la cola.
    }

    // ---------------- Helpers de base de datos ----------------

    private void prepareUserInDb(String email, String rawPassword) {
        // Se crea el usuario directamente en BD como verificado para saltarse el flujo de email.
        // La contraseña se hashea con BCrypt igual que lo haría el servicio de registro real.
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

    // ---------------- Tarjetas de prueba de Stripe ----------------

    // Stripe proporciona números de tarjeta especiales para tests que nunca cobran dinero real.
    private enum StripeCard {
        SUCCESS("4242424242424242", "12/34", "123"),   // Siempre aprueba el pago
        DECLINED("4000000000000002", "12/34", "123");  // Siempre rechaza el pago

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
        // El formulario de tarjeta de Stripe se renderiza dentro de un iframe por seguridad.
        // Selenium necesita cambiar el contexto al iframe antes de poder interactuar con sus campos.
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
