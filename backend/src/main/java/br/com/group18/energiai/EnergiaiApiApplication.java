package br.com.group18.energiai;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class EnergiaiApiApplication {

    public static void main(String[] args) {
        SpringApplication.run(EnergiaiApiApplication.class, args);
    }
}
