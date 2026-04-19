#Paadd code

import java.util.*;

public class Patient {
    private Long id;
    private String name;
    private int age;
    private String address;

    public Long getId() { return id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public int getAge() { return age; }
    public void setAge(int age) { this.age = age; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public static void main(String[] args) {

        Scanner sc = new Scanner(System.in);

        Patient p = new Patient();

        System.out.print("Name: ");
        p.setName(sc.nextLine());

        System.out.print("Age: ");
        p.setAge(sc.nextInt());
        sc.nextLine();

        System.out.print("Address: ");
        p.setAddress(sc.nextLine());

        System.out.println("\n--- Patient Info ---");
        System.out.println("Name: " + p.getName());
        System.out.println("Age: " + p.getAge());
        System.out.println("Address: " + p.getAddress());

        sc.close();
    }
}
