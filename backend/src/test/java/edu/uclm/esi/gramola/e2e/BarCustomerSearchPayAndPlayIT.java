package edu.uclm.esi.gramola.e2e;

import edu.uclm.esi.gramola.dao.QueueItemRepository;
import edu.uclm.esi.gramola.dao.SongPaymentRepository;
import edu.uclm.esi.gramola.dao.SubscriptionPlanRepository;
import edu.uclm.esi.gramola.dao.UserRepository;
import edu.uclm.esi.gramola.dao.UserSubscriptionRepository;
import edu.uclm.esi.gramola.entities.QueueItem;
import edu.uclm.esi.gramola.entities.SongPayment;
import edu.uclm.esi.gramola.entities.SubscriptionPlan;
import edu.uclm.esi.gramola.entities.User;
import edu.uclm.esi.gramola.entities.UserSubscription;
import io.github.bonigarcia.wdm.WebDriverManager;
import org.awaitility.Awaitility;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.junit.jupiter.api.MethodOrderer;
import org.openqa.selenium.By;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.OutputType;
import org.openqa.selenium.TakesScreenshot;
import org.openqa.selenium.interactions.Actions;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.awt.GraphicsEnvironment;
import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * E2E test: a bar customer searches a song, pays it through the UI and adds it to the queue.
 * Verifies that the payment is confirmed in the database and the queue grows in the backend.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class BarCustomerSearchPayAndPlayIT {

    private static final String FRONTEND = System.getProperty("e2e.frontend", "https://localhost:4200");
    private static final Duration WAIT = Duration.ofSeconds(20);
    private static final String CARD_NUMBER = "4242424242424242";
    private static final String CARD_EXPIRY = "12/27";
    private static final String CARD_CVC = "123";
    private static final String CARD_POSTAL = "28001";

    @Autowired
    private UserRepository users;

    @Autowired
    private QueueItemRepository queueRepo;

    @Autowired
    private SongPaymentRepository songPayments;

    @Autowired
    private SubscriptionPlanRepository subscriptionPlanRepo;

    @Autowired
    private UserSubscriptionRepository userSubscriptionRepo;

    private WebDriver driver;
    private WebDriverWait wait;
    private boolean debugMode;

    private String email;
    private final String password = "Password123!";

    @BeforeEach
    public void setup() {
        WebDriverManager.chromedriver().setup();

        ChromeOptions options = new ChromeOptions();
        options.setAcceptInsecureCerts(true);
        options.addArguments("--ignore-certificate-errors");
        options.addArguments("--allow-insecure-localhost");
        options.addArguments("--remote-allow-origins=*");
        options.addArguments("--window-size=1920,1080");

        debugMode = Boolean.getBoolean("selenium.debug") || "1".equals(System.getenv("SELENIUM_DEBUG"));
        boolean headless = GraphicsEnvironment.isHeadless() && !debugMode;
        if (headless) {
            options.addArguments("--headless=new");
        }

        driver = new ChromeDriver(options);
        wait = new WebDriverWait(driver, WAIT);

        long ts = System.currentTimeMillis();
        email = "e2e_user_" + ts + "@test.local";
        prepareUserInDb(email, password);
    }

    @AfterEach
    public void teardown() {
        if (driver != null) {
            try {
                driver.quit();
            } catch (Exception ignored) {
            }
        }
    }

    @Test
    @Order(1)
    public void testCustomerSearchPayAndPlay() {
        try {
            login(email, password);

            Long userId = users.findByEmailIgnoreCase(email).orElseThrow().getId();
            int before = queueRepo.findAllByUser_IdOrderByCreatedAtAsc(userId).size();

            String trackId = searchAndGetFirstTrackId("Imagine");
            assertNotNull(trackId, "Did not find any track in search results");

            clickAddForFirstResult();
            payWithStripe();

            Awaitility.await().atMost(30, TimeUnit.SECONDS).untilAsserted(() -> {
                int after = queueRepo.findAllByUser_IdOrderByCreatedAtAsc(userId).size();
                assertTrue(after > before, "Expected queue size to increase after adding a song");
            });

            List<QueueItem> items = queueRepo.findAllByUser_IdOrderByCreatedAtAsc(userId);
            QueueItem last = items.get(items.size() - 1);
            assertEquals(trackId, last.getTrackId(), "Track added to queue does not match the requested track");

            Awaitility.await().atMost(30, TimeUnit.SECONDS).untilAsserted(() -> {
                boolean confirmed = songPayments.findAll().stream().anyMatch(payment ->
                        payment.getUser() != null
                                && Objects.equals(payment.getUser().getId(), userId)
                                && Objects.equals(payment.getTrackId(), trackId)
                                && payment.getConfirmedAt() != null
                                && (payment.getStatus() == SongPayment.Status.CONFIRMED || payment.getStatus() == SongPayment.Status.CONSUMED)
                );
                assertTrue(confirmed, "Expected a confirmed SongPayment for track " + trackId);
            });
        } catch (Throwable t) {
            takeScreenshot("BarCustomerSearchPayAndPlayIT-failure-" + System.currentTimeMillis() + ".png");
            throw t;
        }
    }

    private void login(String identifier, String pwd) {
        driver.navigate().to(FRONTEND + "/login");
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
        pwdInput.submit();

        waitForRouteOrManualContinue();
        sleepIfDebug(500);
    }

    private void waitForRouteOrManualContinue() {
        System.out.println("Si hace falta introducir el código del correo, hazlo ahora. El test seguirá esperando hasta que termine el login.");
        while (true) {
            String currentUrl = driver.getCurrentUrl();
            if (currentUrl.contains("/queue") || currentUrl.contains("/plans")) {
                return;
            }
            sleepSilently(1000);
        }
    }

    private String searchAndGetFirstTrackId(String query) {
        driver.navigate().to(FRONTEND + "/queue");
        try {
            ((JavascriptExecutor) driver).executeScript("localStorage.setItem('e2e:disableSpotify','1');");
        } catch (Exception ignored) {
        }
        Awaitility.await().atMost(5, TimeUnit.SECONDS).untilAsserted(() -> assertTrue(driver.getCurrentUrl().contains("/queue")));

        WebElement q = wait.until(ExpectedConditions.visibilityOfElementLocated(By.cssSelector("input[name='q']")));
        q.clear();
        q.sendKeys(query);
        q.submit();

        wait.until(ExpectedConditions.presenceOfElementLocated(By.cssSelector(".results ul li")));
        WebElement firstLi = driver.findElement(By.cssSelector(".results ul li"));
        Object res = ((JavascriptExecutor) driver).executeScript(
                "const el = arguments[0]; return el.getAttribute('data-track-id') || el.getAttribute('trackId') || el.getAttribute('trackid') || null;",
                firstLi);
        return res == null ? null : res.toString();
    }

    private void clickAddForFirstResult() {
        WebElement firstEnabled = wait.until(ExpectedConditions.presenceOfAllElementsLocatedBy(By.cssSelector(".results ul li button.btn.outline")))
                .stream()
                .filter(WebElement::isDisplayed)
                .filter(WebElement::isEnabled)
                .findFirst()
                .orElseThrow();
        try {
            ((JavascriptExecutor) driver).executeScript("arguments[0].scrollIntoView({block:'center'});", firstEnabled);
        } catch (Exception ignored) {
        }
        try {
            wait.until(ExpectedConditions.elementToBeClickable(firstEnabled)).click();
        } catch (Exception e) {
            ((JavascriptExecutor) driver).executeScript("arguments[0].click();", firstEnabled);
        }
        sleepIfDebug(300);
    }

    private void payWithStripe() {
        WebElement payButton = wait.until(ExpectedConditions.elementToBeClickable(By.xpath("//button[normalize-space()='Pagar']")));
        ((JavascriptExecutor) driver).executeScript("arguments[0].scrollIntoView({block:'center'});", payButton);
        ((JavascriptExecutor) driver).executeScript("arguments[0].click();", payButton);
        try {
            sleepSilently(2000);

            List<WebElement> cardIframes = driver.findElements(By.cssSelector("#card-element iframe"));
            boolean filled = false;

            if (!cardIframes.isEmpty()) {
                WebElement iframe = cardIframes.get(0);
                wait.until(ExpectedConditions.frameToBeAvailableAndSwitchToIt(iframe));
                waitForStripeFieldReady();
                WebElement active = driver.switchTo().activeElement();
                if (active != null) {
                    try {
                        new Actions(driver).moveToElement(active).click().perform();
                    } catch (Exception ignored) {
                    }
                }
                sleepSilently(1500);
                typeIntoFocusedElement(CARD_NUMBER);
                sleepSilently(900);
                driver.switchTo().activeElement();
                waitForStripeFieldReady();
                sleepSilently(1500);
                typeIntoFocusedElement(CARD_EXPIRY);
                sleepSilently(900);
                driver.switchTo().activeElement();
                waitForStripeFieldReady();
                sleepSilently(1500);
                typeIntoFocusedElement(CARD_CVC);
                sleepSilently(1500);
                typeIntoFocusedElement(CARD_POSTAL);
                filled = true;
            }

            driver.switchTo().defaultContent();

            if (!filled) {
                takeScreenshot("BarCustomerSearchPayAndPlayIT-pay-iframe-failure-" + System.currentTimeMillis() + ".png");
                throw new RuntimeException("Could not find Stripe payment iframe to type into");
            }

            WebElement confirmButton = wait.until(ExpectedConditions.elementToBeClickable(By.xpath("//button[normalize-space()='Confirmar pago']")));
            ((JavascriptExecutor) driver).executeScript("arguments[0].click();", confirmButton);
            sleepIfDebug(700);
        } catch (Throwable t) {
            takeScreenshot("BarCustomerSearchPayAndPlayIT-pay-failure-" + System.currentTimeMillis() + ".png");
            throw t;
        }
    }

    private void waitForStripeFieldReady() {
        wait.until(d -> {
            try {
                WebElement active = d.switchTo().activeElement();
                return active != null && active.isDisplayed() && active.isEnabled();
            } catch (Exception e) {
                return false;
            }
        });
    }

    private void typeIntoFocusedElement(String text) {
        try {
            typeIntoElement(driver.switchTo().activeElement(), text);
        } catch (Exception ignored) {
        }
    }

    private void typeIntoElement(WebElement el, String text) {
        if (el == null) {
            return;
        }
        try {
            new Actions(driver).moveToElement(el).click().perform();
        } catch (Exception ignored) {
        }
        for (char c : text.toCharArray()) {
            try {
                el.sendKeys(Character.toString(c));
            } catch (Exception e) {
                try {
                    new Actions(driver).sendKeys(Character.toString(c)).perform();
                } catch (Exception ignored) {
                }
            }
            sleepSilently(60);
        }
    }

    private void prepareUserInDb(String email, String rawPassword) {
        String bcrypt = new org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder().encode(rawPassword);
        User u = new User();
        u.setEmail(email);
        u.setPassword(bcrypt);
        u.setVerified(true);
        u.setCoins(0);
        users.save(u);

        SubscriptionPlan plan = subscriptionPlanRepo.findByCode("MONTHLY").orElseGet(() -> {
            SubscriptionPlan p = new SubscriptionPlan();
            p.setCode("MONTHLY");
            p.setName("Mensual");
            p.setPriceEur(9);
            p.setDurationMonths(1);
            return subscriptionPlanRepo.save(p);
        });

        UserSubscription us = new UserSubscription();
        us.setUser(u);
        us.setPlan(plan);
        us.setStatus(UserSubscription.Status.ACTIVE);
        us.setStartAt(LocalDateTime.now().minusDays(1));
        us.setEndAt(LocalDateTime.now().plusDays(30));
        userSubscriptionRepo.save(us);
    }

    private void sleepIfDebug(long ms) {
        if (!debugMode) return;
        try {
            Thread.sleep(ms);
        } catch (InterruptedException ignored) {
            Thread.currentThread().interrupt();
        }
    }

    private void sleepSilently(long ms) {
        try {
            Thread.sleep(ms);
        } catch (InterruptedException ignored) {
            Thread.currentThread().interrupt();
        }
    }

    private void takeScreenshot(String name) {
        try {
            if (driver == null) return;
            File scr = ((TakesScreenshot) driver).getScreenshotAs(OutputType.FILE);
            Path out = Paths.get("target", "automation-logs");
            Files.createDirectories(out);
            Files.copy(scr.toPath(), out.resolve(name));
        } catch (Exception ignored) {
        }
    }
}
