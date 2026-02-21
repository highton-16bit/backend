package com.plog.service

import com.plog.entity.User
import com.plog.repository.UserRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.*

@Service
@Transactional(readOnly = true)
class UserService(
    private val userRepository: UserRepository
) {
    fun findByUsername(username: String): User? {
        return userRepository.findByUsername(username)
    }

    fun findById(id: UUID): User? {
        return userRepository.findById(id).orElse(null)
    }

    @Transactional
    fun getOrCreate(username: String): User {
        return userRepository.findByUsername(username)
            ?: userRepository.save(User(username = username))
    }
}
