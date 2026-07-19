package br.com.group18.energiai;

import javax.sql.DataSource;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(properties = {"spring.jpa.hibernate.ddl-auto=none", "spring.main.web-application-type=none"})
class FlywayOracleTest {

    @Autowired
    private DataSource dataSource;

    @Test
    void testConnectionAndMigration() {
        Flyway flyway = Flyway.configure()
                .dataSource(dataSource)
                .locations("classpath:db/migration/oracle")
                .baselineOnMigrate(true)
                .baselineVersion("0")
                .load();

        flyway.migrate();

        System.out.println("SUCESSO: Conexão Oracle OK e Migrations Executadas");
    }
}
