package com.plog.config

import io.swagger.v3.oas.models.OpenAPI
import io.swagger.v3.oas.models.info.Contact
import io.swagger.v3.oas.models.info.Info
import io.swagger.v3.oas.models.servers.Server
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration

@Configuration
class SwaggerConfig {

    @Bean
    fun openAPI(): OpenAPI {
        return OpenAPI()
            .info(
                Info()
                    .title("Plog API")
                    .description("여행 일정 공유 플랫폼 API")
                    .version("1.0.0")
                    .contact(
                        Contact()
                            .name("Plog Team")
                    )
            )
            .servers(
                listOf(
                    Server().url("/").description("Default Server")
                )
            )
    }
}
