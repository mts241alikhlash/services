import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common'
import { ArrayMaxSize, IsArray, IsUUID } from 'class-validator'
import {
  ApiOperation,
  ApiProperty,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger'
import { Public } from '../../../core/decorators/public.decorator.js'
import { ProvisioningTokenGuard } from '../../../core/guards/provisioning-token.guard.js'
import { DayEnum } from '../../../shared/domain/enums/day.enum.js'
import { IScheduleRepository } from '../../domain/repositories/schedule.repository.js'

export class TimetableLessonDto {
  @ApiProperty() id!: string

  @ApiProperty({ description: "HH:mm, already in the school's own clock" })
  startTime!: string

  @ApiProperty({ description: 'HH:mm' })
  endTime!: string

  @ApiProperty() order!: number
  @ApiProperty() subjectName!: string
  @ApiProperty() classroomCode!: string
  @ApiProperty({
    nullable: true,
    description:
      'Null when hr-service no longer has the employee the lesson names.',
  })
  employeeUserId!: string | null

  @ApiProperty({ nullable: true }) room!: string | null
}

export class TimetableLessonListResponseDto {
  @ApiProperty({ type: [TimetableLessonDto] })
  data!: TimetableLessonDto[]
}

export class ScheduleIdsDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayMaxSize(500)
  @IsUUID('4', { each: true })
  ids!: string[]
}

export class ScheduleRefDto {
  @ApiProperty() id!: string
  @ApiProperty() teachingAssignmentId!: string
  @ApiProperty() timeSlotId!: string
}

export class ScheduleRefListResponseDto {
  @ApiProperty({ type: [ScheduleRefDto] })
  data!: ScheduleRefDto[]
}

@ApiTags('Schedules')
@Public()
@UseGuards(ProvisioningTokenGuard)
@Controller('schedules')
export class ScheduleInternalController {
  constructor(private readonly scheduleRepository: IScheduleRepository) {}

  @Post('by-ids')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Schedules for a batch of ids, as ids',
    description:
      'An attendance record in assessment-service names the period it was ' +
      'taken in. This resolves that period to its teaching assignment, which ' +
      'is what carries the subject and classroom.',
  })
  @ApiResponse({ status: 200, type: ScheduleRefListResponseDto })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid provisioning token',
  })
  async byIds(
    @Body() dto: ScheduleIdsDto,
  ): Promise<ScheduleRefListResponseDto> {
    return { data: await this.scheduleRepository.findRefsByIds(dto.ids) }
  }

  @Get('lessons')
  @ApiOperation({
    summary: "One day of a classroom's or an employee's timetable",
    description:
      'Exactly one of classroomId or employeeId. The dashboard in ' +
      'assessment-service renders a day without holding schedules, ' +
      'time slots, subjects or employees of its own.',
  })
  @ApiResponse({ status: 200, type: TimetableLessonListResponseDto })
  @ApiResponse({ status: 400, description: 'Neither or both scopes given' })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid provisioning token',
  })
  async lessons(
    @Query('day') day: string,
    @Query('classroomId') classroomId?: string,
    @Query('employeeId') employeeId?: string,
  ): Promise<TimetableLessonListResponseDto> {
    if (Boolean(classroomId) === Boolean(employeeId)) {
      throw new BadRequestException(
        'Exactly one of classroomId or employeeId is required',
      )
    }
    if (!isDay(day)) {
      throw new BadRequestException(`Unknown day "${day}"`)
    }

    const rows = await this.scheduleRepository.findLessons(
      { classroomId, employeeId },
      day,
    )

    return {
      data: rows.map((row) => ({
        id: row.id,
        startTime: clock(row.startTime),
        endTime: clock(row.endTime),
        order: row.order,
        subjectName: row.subjectName,
        classroomCode: row.classroomCode,
        employeeUserId: row.employeeUserId,
        room: row.room,
      })),
    }
  }
}

function isDay(value: string): value is DayEnum {
  return (Object.values(DayEnum) as string[]).includes(value)
}

function clock(value: Date): string {
  return value.toISOString().slice(11, 16)
}
