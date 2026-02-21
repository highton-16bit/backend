package com.plog.config

import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.core.io.ClassPathResource
import org.springframework.core.io.Resource
import org.springframework.web.cors.CorsConfiguration
import org.springframework.web.cors.UrlBasedCorsConfigurationSource
import org.springframework.web.filter.CorsFilter
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer
import org.springframework.web.servlet.resource.PathResourceResolver

@Configuration
class WebConfig : WebMvcConfigurer {

    @Bean
    fun corsFilter(): CorsFilter {
        val config = CorsConfiguration().apply {
            allowedOriginPatterns = listOf("*")
            allowedMethods = listOf("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
            allowedHeaders = listOf("*")
            allowCredentials = true
            maxAge = 3600L
        }

        val source = UrlBasedCorsConfigurationSource().apply {
            registerCorsConfiguration("/**", config)
        }

        return CorsFilter(source)
    }

    override fun addResourceHandlers(registry: ResourceHandlerRegistry) {
        // 정적 파일 서빙 (SPA 라우팅 지원)
        registry.addResourceHandler("/**")
            .addResourceLocations("classpath:/static/")
            .resourceChain(true)
            .addResolver(object : PathResourceResolver() {
                override fun getResource(resourcePath: String, location: Resource): Resource? {
                    val requestedResource = location.createRelative(resourcePath)

                    // 요청된 리소스가 존재하면 반환
                    if (requestedResource.exists() && requestedResource.isReadable) {
                        return requestedResource
                    }

                    // API 경로는 무시 (Controller에서 처리)
                    if (resourcePath.startsWith("api/") ||
                        resourcePath.startsWith("posts") ||
                        resourcePath.startsWith("travels") ||
                        resourcePath.startsWith("photos") ||
                        resourcePath.startsWith("search") ||
                        resourcePath.startsWith("swagger") ||
                        resourcePath.startsWith("v3/api-docs")
                    ) {
                        return null
                    }

                    // 그 외 모든 경로는 index.html 반환 (SPA 라우팅)
                    return ClassPathResource("/static/index.html")
                }
            })
    }
}
