import { Component, OnInit, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformServer } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Borders, BorderStyle, Workbook } from 'exceljs';
import saveAs from 'file-saver';

type Period = 'MATUTINO' | 'NOTURNO';

interface Course {
  period: Period;
  name: string;
}

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './home-page.html',
  styleUrls: ['./home-page.scss'],
})
export class HomePage implements OnInit {
  public periods: Period[] = ['MATUTINO', 'NOTURNO'];
  public selectedPeriod: Period = 'MATUTINO';
  public selectedCourseName = '';
  public newTeacherName = '';

  public courses: Course[] = [
    { period: 'MATUTINO', name: '1° D.S' },
    { period: 'MATUTINO', name: '2° D.S' },
    { period: 'MATUTINO', name: '3° D.S' },
    { period: 'MATUTINO', name: '1° ADM' },
    { period: 'MATUTINO', name: '2° ADM' },
    { period: 'MATUTINO', name: '3° ADM' },
    { period: 'MATUTINO', name: '1° LOG' },
    { period: 'MATUTINO', name: '2° LOG' },
    { period: 'MATUTINO', name: '3° LOG' },
    { period: 'NOTURNO', name: '1° D.S' },
    { period: 'NOTURNO', name: '2° D.S' },
    { period: 'NOTURNO', name: '3° D.S' },
    { period: 'NOTURNO', name: '1° ADM' },
    { period: 'NOTURNO', name: '2° ADM' },
    { period: 'NOTURNO', name: '3° ADM' },
    { period: 'NOTURNO', name: '1° R.H' },
  ];
  public days: string[] = [
    'Segunda-feira',
    'Terça-feira',
    'Quarta-feira',
    'Quinta-feira',
    'Sexta-feira',
  ];
  public teachers: string[] = [];
  public teacherAssignments: Record<
    string,
    Record<string, Record<string, string | undefined>>
  > = {};
  private platformId = inject(PLATFORM_ID);

  public morningSchedule = [
    '07:30 – 08:20',
    '08:20 – 09:10',
    '09:10 – 10:00',
    'Intervalo (10:00 – 10:15)',
    '10:15 – 11:05',
    '11:05 – 11:55',
    '11:55 – 12:45',
  ];
  public nightOther = [
    '19:00 – 19:50',
    '19:50 – 20:00',
    'Intervalo (20:00 – 20:15)',
    '20:15 – 21:05',
    '21:05 – 21:55',
  ];
  public nightLastYear = [
    '19:00 – 19:50',
    '19:50 – 20:30',
    'Intervalo (20:30 – 20:45)',
    '20:45 – 21:35',
    '21:35 – 22:25',
  ];

  public ngOnInit() {
    if (!isPlatformServer(this.platformId)) {
      const saved = localStorage.getItem('teachers');
      this.teachers = saved ? JSON.parse(saved) : [];
    }
    this.courses.forEach((c) => {
      this.teacherAssignments[c.name] = {};
      this.days.forEach((d) => {
        this.teacherAssignments[c.name][d] = {};
        this.getSchedule(c).forEach(
          (s) => (this.teacherAssignments[c.name][d][s] = undefined)
        );
      });
    });
    this.selectedCourseName = this.filteredCourses[0]?.name || '';
  }

  public get filteredCourses(): Course[] {
    return this.courses.filter((c) => c.period == this.selectedPeriod);
  }

  public getSchedule(course: Course): string[] {
    if (course.period == 'MATUTINO') return this.morningSchedule;
    return !course.name.startsWith('3°') ? this.nightOther : this.nightLastYear;
  }

  public addTeacher(): void {
    if (!this.newTeacherName?.trim()) return;
    this.teachers.push(this.newTeacherName.trim());
    this.teachers.sort();
    if (!isPlatformServer(this.platformId))
      localStorage.setItem('teachers', JSON.stringify(this.teachers));
    this.newTeacherName = '';
  }

  public deleteTeacher(index: number): void {
    this.teachers.splice(index, 1);
    if (!isPlatformServer(this.platformId))
      localStorage.setItem('teachers', JSON.stringify(this.teachers));
  }

  public onTeacherChange(
    courseName: string,
    day: string,
    slot: string,
    selectedTeacher: string
  ): void {
    const teacherName = selectedTeacher.split('(')[1].split(')')[0].trim();
    console.log(teacherName);

    for (const cName in this.teacherAssignments)
      if (
        cName != courseName &&
        this.teacherAssignments[cName][day][slot]?.includes(teacherName)
      )
        alert(
          `O profesor "${teacherName}" já está dando aula em ${cName} na ${day} no horário ${slot}.`
        );

    this.teacherAssignments[courseName][day][slot] = selectedTeacher;
  }

  public async downloadExcel() {
    const workbook = new Workbook();
    workbook.creator = 'Meu App';
    workbook.created = new Date();

    const thinBorder: Partial<Borders> = {
      top: { style: 'thin' as BorderStyle, color: { argb: 'FFE6E6E6' } },
      left: { style: 'thin' as BorderStyle, color: { argb: 'FFE6E6E6' } },
      bottom: { style: 'thin' as BorderStyle, color: { argb: 'FFE6E6E6' } },
      right: { style: 'thin' as BorderStyle, color: { argb: 'FFE6E6E6' } },
    };

    for (const period of this.periods) {
      const ws = workbook.addWorksheet(period, {
        views: [{ showGridLines: false }],
      });
      const coursesInPeriod = this.courses
        .filter((c) => c.period === period)
        .map((c) => c.name);

      const headerRow = ws.addRow(['Dia / Horário', ...coursesInPeriod]);
      headerRow.eachCell((cell) => {
        cell.font = {
          name: 'Roboto',
          size: 10,
          bold: true,
          color: { argb: 'FFFFFFFF' },
        };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = thinBorder;
        if (cell.value) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFB20000' },
          };
        }
      });

      for (const day of this.days) {
        this.getSchedule({ period, name: '' }).forEach((slot, idx) => {
          const label = `${day} ${slot}`;
          const rowData = [label];
          for (const courseName of coursesInPeriod) {
            const teacher = this.teacherAssignments[courseName][day]?.[slot];
            rowData.push(teacher ?? '');
          }
          const row = ws.addRow(rowData);
          row.eachCell((cell) => {
            cell.font = { name: 'Roboto', size: 10 };
            cell.alignment = {
              vertical: 'middle',
              horizontal: 'center',
              wrapText: true,
            };
            cell.border = thinBorder;
            if (idx % 2 === 1) {
              cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFF8F8F8' },
              };
            }
          });
        });
      }
    }

    for (const course of this.courses) {
      const ws = workbook.addWorksheet(`${course.name} ${course.period}`, {
        views: [{ showGridLines: false }],
      });

      const slots = this.getSchedule(course);

      const header = ['Horário', ...this.days];
      const headerRow = ws.addRow(header);

      headerRow.eachCell((cell) => {
        cell.font = {
          name: 'Roboto',
          size: 10,
          bold: true,
          color: { argb: 'FFFFFFFF' },
        };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = thinBorder;
        if (cell.value) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFB20000' },
          };
        }
      });

      slots.forEach((slot, idxSlot) => {
        const rowData = [slot];
        this.days.forEach((day) => {
          const teacher = this.teacherAssignments[course.name][day]?.[slot];
          rowData.push(teacher ?? '');
        });
        const row = ws.addRow(rowData);
        row.eachCell((cell) => {
          cell.font = { name: 'Roboto', size: 10 };
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
          cell.border = thinBorder;
          if (idxSlot % 2 === 1) {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFF8F8F8' },
            };
          }
        });
      });

      ws.columns.forEach((col) => (col.width = 18));
    }

    workbook.worksheets.forEach((ws) =>
      ws.columns?.forEach((column) => {
        let maxLength = 10;
        if (column.eachCell)
          column.eachCell({ includeEmpty: true }, (cell) => {
            const val = cell.value ? String(cell.value) : '';
            maxLength = Math.max(maxLength, val.length);
          });
        column.width = maxLength * 1.5;
      })
    );

    const buf = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buf], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    saveAs(blob, `HORÁRIOS - ETEC DE GUARULHOS.xlsx`);
  }
}
