$ErrorActionPreference = 'Stop'

$KeystorePath = "c:\Users\Elias\OneDrive - Universidad de Castilla-La Mancha\Escritorio\musicfinder\TrabajoTecnologiasEliasGlez\backend\src\main\resources\ssl\keystore.p12"
$StorePass = 'changeit'

if (Test-Path $KeystorePath) {
  Remove-Item -Force $KeystorePath
}

# Creates a self-signed cert for Spring Boot HTTPS with SAN for both localhost and 127.0.0.1
keytool -genkeypair -alias gramola -keyalg RSA -keysize 2048 -storetype PKCS12 `
  -keystore $KeystorePath -storepass $StorePass -keypass $StorePass `
  -dname "CN=localhost, OU=Dev, O=Gramola, L=Ciudad, ST=Provincia, C=ES" `
  -ext "SAN=dns:localhost,ip:127.0.0.1" -validity 3650

Write-Host "Created keystore: $KeystorePath" -ForegroundColor Green
