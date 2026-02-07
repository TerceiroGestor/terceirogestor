import { Test, TestingModule } from '@nestjs/testing';
import { PeopleService } from './people.service';
import { PeopleController } from './people.controller';

describe('PeopleController', () => {
  let controller: PeopleController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PeopleController],
      providers: [{ provide: PeopleService, useValue: {} as PeopleService }],
    }).compile();

    controller = module.get<PeopleController>(PeopleController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
