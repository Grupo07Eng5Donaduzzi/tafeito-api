import { Test, type TestingModule } from '@nestjs/testing';
import { AuditService } from './audit.service';
import { AUDIT_LOG_REPOSITORY } from '../../domain/repositories/audit-log-repository.interface';
import { AuditLog } from '../../domain/models/audit-log.entity';

describe('AuditService', () => {
  let service: AuditService;
  let mockRepository: any;

  beforeEach(async () => {
    mockRepository = {
      create: jest.fn().mockResolvedValue(undefined),
      findByActionAndTarget: jest.fn(),
      findAll: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        {
          provide: AUDIT_LOG_REPOSITORY,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<AuditService>(AuditService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('log', () => {
    it('should create and save an audit log', async () => {
      const action = 'PAYMENT_INITIATED';
      const targetId = 'payment-123';
      const userId = 'user-456';
      const details = { amount: 100 };

      await service.log(action, targetId, userId, details);

      expect(mockRepository.create).toHaveBeenCalledTimes(1);
      const passedLog = mockRepository.create.mock.calls[0][0];
      expect(passedLog).toBeInstanceOf(AuditLog);
      expect(passedLog.action).toBe(action);
      expect(passedLog.targetId).toBe(targetId);
      expect(passedLog.userId).toBe(userId);
      expect(passedLog.details).toEqual(details);
    });
  });

  describe('hasAlreadyLogged', () => {
    it('should return true if log already exists', async () => {
      const action = 'PAYMENT_APPROVED';
      const targetId = 'payment-123';
      const restoredLog = AuditLog.restore({
        id: 'log-uuid',
        action,
        targetId,
        userId: 'user-456',
        createdAt: new Date(),
      });
      mockRepository.findByActionAndTarget.mockResolvedValue(restoredLog);

      const result = await service.hasAlreadyLogged(action, targetId);

      expect(mockRepository.findByActionAndTarget).toHaveBeenCalledWith(
        action,
        targetId,
      );
      expect(result).toBe(true);
    });

    it('should return false if log does not exist', async () => {
      const action = 'PAYMENT_APPROVED';
      const targetId = 'payment-123';
      mockRepository.findByActionAndTarget.mockResolvedValue(null);

      const result = await service.hasAlreadyLogged(action, targetId);

      expect(mockRepository.findByActionAndTarget).toHaveBeenCalledWith(
        action,
        targetId,
      );
      expect(result).toBe(false);
    });
  });
});
