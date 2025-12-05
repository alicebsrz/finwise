"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = exports.register = void 0;
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma = new client_1.PrismaClient();
// Registro: Cria Empresa + Usuário Admin ao mesmo tempo
const register = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, email, password, companyName } = req.body;
    try {
        // Verifica se usuário já existe
        const userExists = yield prisma.user.findUnique({ where: { email } });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }
        // Criptografa a senha
        const salt = yield bcryptjs_1.default.genSalt(10);
        const passwordHash = yield bcryptjs_1.default.hash(password, salt);
        // Transação: Cria Company e User juntos. Se um falhar, tudo falha.
        const result = yield prisma.$transaction((prisma) => __awaiter(void 0, void 0, void 0, function* () {
            const company = yield prisma.company.create({
                data: { name: companyName }
            });
            const user = yield prisma.user.create({
                data: {
                    name,
                    email,
                    passwordHash,
                    companyId: company.id,
                    role: 'ADMIN' // Primeiro usuário é sempre Admin
                }
            });
            return { company, user };
        }));
        res.status(201).json({
            message: 'Company and Admin registered successfully',
            user: { id: result.user.id, name: result.user.name, email: result.user.email }
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.register = register;
// Login: Valida senha e devolve Token
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = req.body;
    try {
        const user = yield prisma.user.findUnique({ where: { email } });
        if (!user)
            return res.status(400).json({ message: 'Invalid credentials' });
        const isMatch = yield bcryptjs_1.default.compare(password, user.passwordHash);
        if (!isMatch)
            return res.status(400).json({ message: 'Invalid credentials' });
        // Gera o Token JWT
        const token = jsonwebtoken_1.default.sign({ userId: user.id, companyId: user.companyId, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' } // Expira em 1 dia
        );
        res.json({ token, user: { id: user.id, name: user.name, role: user.role } });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.login = login;
