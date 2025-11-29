import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { JwtService } from '../service/jwt.service';

@Component({
  selector: 'app-coach-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './coach-navbar.component.html',
  styleUrls: ['./coach-navbar.component.css']
})
export class CoachNavbarComponent implements OnInit {
  coachName: string = 'Coach';
  showUserMenu: boolean = false;

  constructor(
    private router: Router,
    private jwtService: JwtService
  ) {}

  ngOnInit(): void {
    this.getCoachName();
  }

  getCoachName(): void {
    const role = this.jwtService.getRole();
    if (role) {
      this.coachName = role.replace('ROLE_', '');
    }
  }

  toggleUserMenu(): void {
    this.showUserMenu = !this.showUserMenu;
  }

  logout(): void {
    this.showUserMenu = false;
    localStorage.clear();
    this.router.navigate(['/login']);
  }
}
