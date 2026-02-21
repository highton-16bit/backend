package com.plog.config

import com.plog.dto.MessageResponse
import org.slf4j.LoggerFactory
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.RestControllerAdvice
import org.springframework.web.servlet.NoHandlerFoundException
import jakarta.persistence.EntityNotFoundException

@RestControllerAdvice
class GlobalExceptionHandler {

    private val log = LoggerFactory.getLogger(GlobalExceptionHandler::class.java)

    @ExceptionHandler(IllegalArgumentException::class)
    fun handleIllegalArgument(e: IllegalArgumentException): ResponseEntity<MessageResponse> {
        log.warn("IllegalArgumentException: ${e.message}")
        return ResponseEntity.badRequest()
            .body(MessageResponse(e.message ?: "Invalid request"))
    }

    @ExceptionHandler(EntityNotFoundException::class)
    fun handleEntityNotFound(e: EntityNotFoundException): ResponseEntity<MessageResponse> {
        log.warn("EntityNotFoundException: ${e.message}")
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
            .body(MessageResponse(e.message ?: "Entity not found"))
    }

    @ExceptionHandler(NoHandlerFoundException::class)
    fun handleNotFound(e: NoHandlerFoundException): ResponseEntity<MessageResponse> {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
            .body(MessageResponse("Endpoint not found: ${e.requestURL}"))
    }

    @ExceptionHandler(AccessDeniedException::class)
    fun handleAccessDenied(e: AccessDeniedException): ResponseEntity<MessageResponse> {
        log.warn("AccessDeniedException: ${e.message}")
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
            .body(MessageResponse(e.message ?: "Access denied"))
    }

    @ExceptionHandler(Exception::class)
    fun handleGenericException(e: Exception): ResponseEntity<MessageResponse> {
        log.error("Unhandled exception", e)
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(MessageResponse("Server error: ${e.message ?: e.javaClass.simpleName}"))
    }
}
