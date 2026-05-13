plugins {
    kotlin("jvm") version "2.1.0"
    kotlin("plugin.serialization") version "2.1.0"
    application
}

repositories {
    mavenCentral()
}

dependencies {
    implementation("dev.kourier:amqp-client:0.4.3")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.10.2")
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.7.3")
    implementation("ch.qos.logback:logback-classic:1.5.6")
    implementation("com.sun.mail:jakarta.mail:2.0.1")
}

kotlin {
    jvmToolchain(21)
}

application {
    mainClass.set("com.example.notification.MainKt")
}

tasks.test {
    useJUnitPlatform()
}
