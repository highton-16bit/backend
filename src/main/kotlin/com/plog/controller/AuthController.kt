package com.plog.controller

import com.plog.dto.AuthRequest
import com.plog.dto.MessageResponse
import com.plog.service.UserService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@Tag(name = "Auth", description = "인증 API")
@RestController
@RequestMapping("/auth")
class AuthController(
    private val userService: UserService
) {
    @Operation(summary = "회원가입/로그인", description = "사용자명으로 회원가입 또는 로그인합니다")
    @PostMapping
    fun authenticate(@RequestBody request: AuthRequest): ResponseEntity<MessageResponse> {
        if (request.username.isBlank()) {
            return ResponseEntity.badRequest().body(MessageResponse("Username is required"))
        }

        userService.getOrCreate(request.username)
        return ResponseEntity.ok(MessageResponse("OK"))
    }
}
