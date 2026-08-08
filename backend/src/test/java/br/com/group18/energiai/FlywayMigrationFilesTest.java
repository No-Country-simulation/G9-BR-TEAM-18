package br.com.group18.energiai;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.net.URL;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Enumeration;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Stream;
import org.junit.jupiter.api.Test;

class FlywayMigrationFilesTest {

    private static final Pattern MIGRATION_FILE_PATTERN = Pattern.compile("^V(\\d+)__(.+)\\.sql$");
    private static final String MIGRATIONS_CLASSPATH = "db/migration/oracle";

    @Test
    void shouldContainAtLeastOneMigrationFile() throws Exception {
        assertFalse(migrationFiles().isEmpty(), "Pelo menos uma migração Flyway deve existir em db/migration/oracle");
    }

    @Test
    void shouldFollowFlywayNamingConventionOnEveryFile() throws Exception {
        for (Path file : migrationFiles()) {
            String fileName = file.getFileName().toString();
            assertTrue(
                    MIGRATION_FILE_PATTERN.matcher(fileName).matches(),
                    () -> "Arquivo '" + fileName + "' não segue o padrão V<número>__<descrição>.sql");
        }
    }

    @Test
    void shouldHaveSequentialVersionsWithoutGapsOrDuplicates() throws Exception {
        List<Integer> versions = migrationFiles().stream()
                .map(file -> versionOf(file.getFileName().toString()))
                .sorted()
                .toList();

        assertEquals(versions.size(), versions.stream().distinct().count(), "Versões de migração duplicadas");
        assertEquals(
                versions.size(),
                versions.get(versions.size() - 1),
                "Versões de migração devem ser sequenciais a partir de 1");
    }

    private int versionOf(String fileName) {
        Matcher matcher = MIGRATION_FILE_PATTERN.matcher(fileName);
        if (!matcher.matches()) {
            throw new IllegalStateException("Arquivo de migração com nome inválido: " + fileName);
        }
        return Integer.parseInt(matcher.group(1));
    }

    private List<Path> migrationFiles() throws Exception {
        List<Path> files = new ArrayList<>();
        Enumeration<URL> resources = getClass().getClassLoader().getResources(MIGRATIONS_CLASSPATH);
        while (resources.hasMoreElements()) {
            Path directory = Path.of(resources.nextElement().toURI());
            try (Stream<Path> paths = Files.list(directory)) {
                paths.filter(Files::isRegularFile).forEach(files::add);
            }
        }
        return files;
    }
}
